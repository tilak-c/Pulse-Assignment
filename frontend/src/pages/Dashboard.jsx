import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Play, Trash2, ShieldCheck, ShieldAlert, Loader2, Search, Filter, Calendar, FileVideo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ 
    status: '', 
    sensitivity: '', 
    search: '', 
    category: '',
    fromDate: '',
    toDate: '',
    minSize: '',
    maxSize: ''
  });
  const { user } = useAuth();
  const socketRef = useRef();

  useEffect(() => {
    fetchVideos();

    // Socket.io for real-time updates
    socketRef.current = io('http://localhost:5001');
    const orgRoom = `org_${user.organization}`;
    socketRef.current.emit('join', orgRoom);

    socketRef.current.on('videoStatusUpdate', (data) => {
      setVideos((prevVideos) => 
        prevVideos.map((v) => {
          if (v._id === data.videoId) {
            return { 
              ...v, 
              status: data.status, 
              processingProgress: data.progress ?? v.processingProgress,
              sensitivity: data.sensitivity ?? v.sensitivity
            };
          }
          return v;
        })
      );
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user.organization]);

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = { ...filter };
      
      // Convert MB to bytes for size filtering
      if (params.minSize) params.minSize = params.minSize * 1024 * 1024;
      if (params.maxSize) params.maxSize = params.maxSize * 1024 * 1024;

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        params,
      };
      const { data } = await axios.get('http://localhost:5001/api/videos', config);
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5001/api/videos/${id}`, config);
        setVideos(videos.filter((v) => v._id !== id));
      } catch (error) {
        alert('Error deleting video');
      }
    }
  };

  const getStatusBadge = (video) => {
    switch (video.status) {
      case 'completed':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            video.sensitivity === 'safe' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
          }`}>
            {video.sensitivity === 'safe' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
            <span>{video.sensitivity.toUpperCase()}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold flex items-center space-x-1">
            <Loader2 size={12} className="animate-spin" />
            <span>PROCESSING {video.processingProgress}%</span>
          </span>
        );
      case 'failed':
        return <span className="px-2 py-1 rounded-full bg-red-900/40 text-red-400 text-xs font-bold">FAILED</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-bold">PENDING</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 w-full">
      <div className="w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Video Library</h1>
            <p className="text-gray-400 mt-1">Manage and monitor your video content</p>
          </div>
          {(user.role === 'admin' || user.role === 'editor') && (
            <Link
              to="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Upload New Video</span>
            </Link>
          )}
        </header>

        <section className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by title..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none"
              value={filter.sensitivity}
              onChange={(e) => setFilter({ ...filter, sensitivity: e.target.value })}
            >
              <option value="">All Safety</option>
              <option value="safe">Safe</option>
              <option value="flagged">Flagged</option>
            </select>
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none"
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Training">Training</option>
              <option value="Marketing">Marketing</option>
              <option value="Internal">Internal</option>
            </select>
          </div>
        </section>

        <section className="bg-gray-900/30 p-4 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase font-bold">From Date</label>
            <input 
              type="date" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              value={filter.fromDate}
              onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase font-bold">To Date</label>
            <input 
              type="date" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              value={filter.toDate}
              onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase font-bold">Min Size (MB)</label>
            <input 
              type="number" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              placeholder="0"
              value={filter.minSize}
              onChange={(e) => setFilter({ ...filter, minSize: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 uppercase font-bold">Max Size (MB)</label>
            <input 
              type="number" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              placeholder="100"
              value={filter.maxSize}
              onChange={(e) => setFilter({ ...filter, maxSize: e.target.value })}
            />
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <p className="text-gray-400">Loading your videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-800">
            <FileVideo size={64} className="mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">No videos found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or upload a new video</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video._id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-blue-500/50 transition-all group shadow-xl"
              >
                <div className="aspect-video bg-gray-800 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent z-10" />
                  <FileVideo size={48} className="text-gray-700 group-hover:scale-110 transition-transform" />
                  {video.status === 'completed' && (
                    <Link
                      to={`/video/${video._id}`}
                      className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                    >
                      <div className="bg-blue-600 p-4 rounded-full shadow-xl shadow-blue-500/30 transform scale-75 group-hover:scale-100 transition-transform">
                        <Play fill="white" size={24} />
                      </div>
                    </Link>
                  )}
                  <div className="absolute top-3 right-3 z-20">
                    {getStatusBadge(video)}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{video.category}</span>
                      {video.versions && video.versions.length > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded">HD READY</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold truncate text-white group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-gray-700 rounded-full" />
                        <span>{(video.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span className="text-xs text-gray-500 font-medium">ORG: {video.organization}</span>
                    {(user.role === 'admin' || (user.role === 'editor' && video.user === user._id)) && (
                      <button
                        onClick={() => handleDelete(video._id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
