import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const compressVideo = async (video, quality, width, io) => {
  const videoId = video._id.toString();
  const orgRoom = `org_${video.organization}`;
  const inputPath = video.path;
  const outputDir = path.dirname(inputPath);
  const outputFilename = `v_${quality}_${path.basename(inputPath)}`;
  const outputPath = path.join(outputDir, outputFilename);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .size(`${width}x?`)
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(outputPath)
      .on('progress', (progress) => {
        // Emit sub-progress for compression
        // Not implemented for now to keep it simple, but could be added
      })
      .on('end', async () => {
        const stats = fs.statSync(outputPath);
        video.versions.push({
          quality,
          path: outputPath,
          size: stats.size,
        });
        await video.save();
        resolve();
      })
      .on('error', (err) => {
        console.error(`Compression error for ${quality}:`, err);
        reject(err);
      })
      .run();
  });
};

const processVideo = async (video, io) => {
  try {
    const videoId = video._id.toString();
    const orgRoom = `org_${video.organization}`;
    const filePath = video.path;

    // Update status to processing
    video.status = 'processing';
    video.processingProgress = 0;
    await video.save();

    const updateData = { videoId, progress: 10, status: 'processing' };
    io.to(videoId).emit('processingProgress', updateData);
    io.to(orgRoom).emit('videoStatusUpdate', updateData);

    // 1. Probing and Sensitivity (existing logic)
    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (err) {
        console.error('Error probing video:', err);
        video.status = 'failed';
        await video.save();
        const errorData = { videoId, error: 'Failed to process video' };
        io.to(videoId).emit('processingError', errorData);
        io.to(orgRoom).emit('videoStatusUpdate', { videoId, status: 'failed' });
        return;
      }

      const duration = metadata.format.duration;
      video.duration = duration;
      await video.save();

      const analysisData = { videoId, progress: 30, status: 'analyzing sensitivity' };
      io.to(videoId).emit('processingProgress', analysisData);
      io.to(orgRoom).emit('videoStatusUpdate', analysisData);

      // 2. Sensitivity Simulation
      setTimeout(async () => {
        const isSafe = Math.random() > 0.1;
        video.sensitivity = isSafe ? 'safe' : 'flagged';
        await video.save();

        const compressionUpdate = { videoId, progress: 60, status: 'generating qualities' };
        io.to(videoId).emit('processingProgress', compressionUpdate);
        io.to(orgRoom).emit('videoStatusUpdate', compressionUpdate);

        // 3. Compression / Multi-quality generation
        try {
          // Generate 360p as a baseline
          await compressVideo(video, '360p', 640, io);
          
          video.status = 'completed';
          video.processingProgress = 100;
          await video.save();

          const completedData = { 
            videoId,
            progress: 100, 
            status: 'completed', 
            sensitivity: video.sensitivity 
          };
          io.to(videoId).emit('processingProgress', completedData);
          io.to(orgRoom).emit('videoStatusUpdate', completedData);
        } catch (compErr) {
          console.error('Compression failed:', compErr);
          // Fallback: still mark as completed if primary upload is fine
          video.status = 'completed';
          video.processingProgress = 100;
          await video.save();
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Video processing error:', error);
    video.status = 'failed';
    await video.save();
    const errorData = { videoId: video._id.toString(), error: error.message };
    io.to(video._id.toString()).emit('processingError', errorData);
    io.to(`org_${video.organization}`).emit('videoStatusUpdate', { videoId: video._id.toString(), status: 'failed' });
  }
};

export { processVideo };
