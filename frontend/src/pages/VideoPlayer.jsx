import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { ChevronLeft, ShieldCheck, ShieldAlert, Loader2, Calendar, FileVideo, Info } from 'lucide-react';

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [quality, setQuality] = useState('original');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef();

  useEffect(() => {
    fetchVideo();

    // Socket.io for real-time updates
    socketRef.current = io('http://localhost:5001');
    socketRef.current.emit('join', id);

    socketRef.current.on('processingProgress', (data) => {
      setProcessingStatus(data);
      if (data.status === 'completed') {
        fetchVideo(); // Refresh video data
      }
    });

    socketRef.current.on('processingError', (data) => {
      setError(data.error);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Reuse getVideos with ID filter or implement getById. 
      // For simplicity, let's use the list API and filter locally or implement a new endpoint.
      // I'll assume I have a getById endpoint or I'll just use the list API.
      const { data } = await axios.get(`http://localhost:5001/api/videos`, config);
      const foundVideo = data.find(v => v._id === id);
      
      if (!foundVideo) {
        setError('Video not found');
      } else {
        setVideo(foundVideo);
      }
    } catch (err) {
      setError('Error fetching video details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-gray-400">Loading player...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl flex items-center space-x-4 text-red-400 max-w-md">
          <ShieldAlert size={48} />
          <div>
            <h2 className="text-xl font-bold">Error</h2>
            <p className="text-sm">{error || 'Something went wrong'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to Library</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 w-full">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white font-semibold transition-all group"
          >
            <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-gray-800 border border-gray-800">
              <ChevronLeft size={20} />
            </div>
            <span>Back to Library</span>
          </button>
          <div className="flex items-center space-x-3">
            {video.sensitivity === 'safe' ? (
              <span className="px-4 py-1.5 rounded-full bg-green-900/40 text-green-400 border border-green-500/30 text-xs font-black tracking-widest flex items-center space-x-2">
                <ShieldCheck size={14} />
                <span>SAFE CONTENT</span>
              </span>
            ) : video.sensitivity === 'flagged' ? (
              <span className="px-4 py-1.5 rounded-full bg-red-900/40 text-red-400 border border-red-500/30 text-xs font-black tracking-widest flex items-center space-x-2">
                <ShieldAlert size={14} />
                <span>FLAGGED CONTENT</span>
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-500/30 text-xs font-black tracking-widest flex items-center space-x-2">
                <Loader2 size={14} className="animate-spin" />
                <span>PROCESSING {processingStatus?.progress || video.processingProgress}%</span>
              </span>
            )}
          </div>
        </div>

        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 ring-1 ring-gray-800/50">
          {video.status === 'completed' ? (
            <video
              key={`${id}-${quality}`}
              className="w-full h-full object-contain"
              controls
              autoPlay
              controlsList="nodownload"
              src={`http://localhost:5001/api/videos/stream/${id}?token=${user.token}${quality !== 'original' ? `&quality=${quality}` : ''}`} // Range request will be handled by browser
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 space-y-6 p-12 text-center">
              <div className="p-8 bg-blue-600/10 rounded-full text-blue-500 animate-pulse shadow-2xl shadow-blue-500/5">
                <Loader2 size={64} className="animate-spin" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-3xl font-black text-white">Processing in Progress</h2>
                <p className="text-gray-400 text-lg">We're analyzing your video for sensitivity. It'll be ready for playback in just a moment.</p>
              </div>
              <div className="w-full max-w-xs h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-lg shadow-blue-500/50" 
                  style={{ width: `${processingStatus?.progress || video.processingProgress}%` }} 
                />
              </div>
              <p className="text-blue-400 font-black tracking-tighter text-xl">{processingStatus?.progress || video.processingProgress}% COMPLETE</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 shadow-xl space-y-4">
              <h1 className="text-4xl font-black text-white leading-tight">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-400">
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                  <Calendar size={18} className="text-blue-400" />
                  <span className="font-medium text-sm">{new Date(video.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                  <FileVideo size={18} className="text-blue-400" />
                  <span className="font-medium text-sm">{(video.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                  <Info size={18} className="text-blue-400" />
                  <span className="font-medium text-sm uppercase tracking-widest">{video.organization}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Video Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Processing</span>
                  <span className={`font-black text-sm ${video.status === 'completed' ? 'text-green-400' : 'text-blue-400 animate-pulse'}`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sensitivity</span>
                  <span className={`font-black text-sm ${video.sensitivity === 'safe' ? 'text-green-400' : video.sensitivity === 'flagged' ? 'text-red-400' : 'text-blue-400'}`}>
                    {video.sensitivity.toUpperCase()}
                  </span>
                </div>
                {video.versions && video.versions.length > 0 && (
                  <div className="flex flex-col space-y-3 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Quality Settings</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setQuality('original')}
                        className={`px-3 py-1 rounded text-[10px] font-black tracking-widest transition-all ${quality === 'original' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                      >
                        ORIGINAL
                      </button>
                      {video.versions.map(v => (
                        <button 
                          key={v.quality}
                          onClick={() => setQuality(v.quality)}
                          className={`px-3 py-1 rounded text-[10px] font-black tracking-widest transition-all ${quality === v.quality ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                          {v.quality.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
