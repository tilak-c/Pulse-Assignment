import Video from '../models/Video.js';
import fs from 'fs';
import path from 'path';
import { processVideo } from '../utils/videoProcessor.js';

const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file provided' });
  }

  const { title, category } = req.body;

  try {
    const video = await Video.create({
      user: req.user._id,
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: category || 'General',
      organization: req.user.organization,
    });

    // Start processing asynchronously
    const io = req.app.get('socketio');
    processVideo(video, io);

    res.status(201).json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading video' });
  }
};

const getVideos = async (req, res) => {
  const { status, sensitivity, search, category, minSize, maxSize, minDuration, maxDuration, fromDate, toDate } = req.query;
  
  // Multi-tenant: Everyone in the same organization can see all videos of that organization
  const query = { organization: req.user.organization };

  if (status) query.status = status;
  if (sensitivity) query.sensitivity = sensitivity;
  if (category) query.category = category;
  if (search) query.title = { $regex: search, $options: 'i' };

  // File size filtering
  if (minSize || maxSize) {
    query.size = {};
    if (minSize) query.size.$gte = parseInt(minSize);
    if (maxSize) query.size.$lte = parseInt(maxSize);
  }

  // Duration filtering
  if (minDuration || maxDuration) {
    query.duration = {};
    if (minDuration) query.duration.$gte = parseInt(minDuration);
    if (maxDuration) query.duration.$lte = parseInt(maxDuration);
  }

  // Date filtering
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  try {
    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

const streamVideo = async (req, res) => {
  const { id } = req.params;
  const { quality } = req.query;

  try {
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // RBAC & Multi-tenant: Check if user belongs to the same organization
    if (req.user.organization !== video.organization && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view videos from other organizations' });
    }

    // CDN Simulation: Add a header to simulate CDN delivery
    res.setHeader('X-CDN-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    let videoPath = path.resolve(video.path);
    let currentMimetype = video.mimetype || 'video/mp4';

    // If a specific quality is requested and exists, use that path
    if (quality && video.versions && video.versions.length > 0) {
      const version = video.versions.find(v => v.quality === quality);
      if (version) {
        videoPath = path.resolve(version.path);
      }
    }

    const stat = fs.statSync(videoPath);
     const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimetype || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype || 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error streaming video' });
  }
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // RBAC & Multi-tenant check:
    // 1. Must be same organization
    // 2. Must be Admin OR Editor
    const isSameOrg = req.user.organization === video.organization;
    const isAdmin = req.user.role === 'admin';
    const isEditor = req.user.role === 'editor';

    if (!isAdmin && (!isSameOrg || !isEditor)) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Delete file
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }

    await Video.deleteOne({ _id: id });
    res.json({ message: 'Video removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video' });
  }
};

export { uploadVideo, getVideos, streamVideo, deleteVideo };
