import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileVideo, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name.split('.')[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('category', category);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      };

      await axios.post('http://localhost:5001/api/videos/upload', formData, config);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-900 rounded-3xl shadow-2xl p-10 border border-gray-800 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Upload Content</h1>
          <p className="text-gray-400 text-lg">Add new videos to your organization library</p>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center space-x-3 text-red-400">
            <AlertCircle size={24} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-xl flex items-center space-x-3 text-green-400">
            <CheckCircle size={24} />
            <span className="font-medium">Video uploaded successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider block">Video Title</label>
            <input
              type="text"
              required
              disabled={uploading}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-600"
              placeholder="Give your video a name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider block">Category</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
            >
              <option value="General">General</option>
              <option value="Training">Training</option>
              <option value="Marketing">Marketing</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          {!file ? (
            <div
              onClick={() => fileInputRef.current.click()}
              className="group border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-800/30 hover:bg-blue-600/5 space-y-4"
            >
              <div className="p-6 bg-blue-600/10 rounded-full text-blue-500 group-hover:scale-110 transition-transform shadow-xl shadow-blue-500/5">
                <UploadIcon size={48} />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-200">Drop your video here</p>
                <p className="text-gray-500 mt-2">or click to browse your files (MP4, MKV, AVI)</p>
                <p className="text-xs text-gray-600 mt-4 uppercase font-bold tracking-widest">Max file size: 50MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-6 flex items-center space-x-6 border border-gray-700 shadow-xl relative overflow-hidden group">
              <div className="p-4 bg-blue-600/10 rounded-xl text-blue-400 group-hover:scale-105 transition-transform">
                <FileVideo size={40} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button
                  onClick={clearFile}
                  className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              )}
              {uploading && (
                <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-5 rounded-2xl font-black text-xl tracking-wide shadow-2xl transition-all flex items-center justify-center space-x-3 ${
              !file || uploading
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 transform hover:-translate-y-1 active:scale-[0.98]'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={28} />
                <span>UPLOADING {uploadProgress}%</span>
              </>
            ) : (
              <>
                <CheckCircle size={28} />
                <span>START UPLOAD</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
