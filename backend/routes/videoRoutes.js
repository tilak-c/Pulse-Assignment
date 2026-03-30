import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadVideo, getVideos, streamVideo, deleteVideo } from '../controllers/videoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mkv|avi|mov|wmv|flv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Videos only!');
    }
  },
});

router.post('/upload', protect, authorize('admin', 'editor'), upload.single('video'), uploadVideo);
router.get('/', protect, getVideos);
router.get('/stream/:id', protect, streamVideo);
router.delete('/:id', protect, authorize('admin', 'editor'), deleteVideo);

export default router;
