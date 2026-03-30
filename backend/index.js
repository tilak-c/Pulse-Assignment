import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For demo, allow all
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
  },
});

app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (id) => {
    socket.join(id);
    console.log(`Socket ${socket.id} joined room ${id}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
