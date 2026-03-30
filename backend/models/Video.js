import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  sensitivity: {
    type: String,
    enum: ['pending', 'safe', 'flagged'],
    default: 'pending',
  },
  processingProgress: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'General',
  },
  versions: [
    {
      quality: { type: String }, // e.g., '360p', '720p', '1080p'
      path: { type: String },
      size: { type: Number },
    },
  ],
  organization: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
