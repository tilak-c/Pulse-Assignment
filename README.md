# Video Streaming & Sensitivity Processing Application

A full-stack application for uploading, processing, and streaming videos with real-time updates and content sensitivity analysis.

## Features

- **User Authentication**: JWT-based login/register with Role-Based Access Control (Admin, Editor, Viewer).
- **Multi-Tenancy**: Organizations can isolate their data.
- **Video Upload**: Secure upload with progress tracking (up to 50MB).
- **Real-Time Processing**: Socket.io updates for video metadata extraction and sensitivity analysis.
- **Sensitivity Analysis**: Automated content screening (Mocked with FFmpeg integration).
- **Video Streaming**: Efficient playback using HTTP range requests.
- **Video Library**: Search and filter videos by status and safety.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Socket.io, Multer, FFmpeg.
- **Frontend**: React, Vite, Tailwind CSS, Lucide-React, Axios.

## Prerequisites

- Node.js (v18+)
- MongoDB (Running locally or on Atlas)
- FFmpeg (Installed on your system, though `ffmpeg-static` is included)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/video_app
   JWT_SECRET=your_jwt_secret
   UPLOAD_PATH=uploads/
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and get token.
- `GET /api/auth/me`: Get current user info.

### Videos
- `GET /api/videos`: List videos (supports `search`, `status`, `sensitivity` filters).
- `POST /api/videos/upload`: Upload a new video (Editor/Admin only).
- `GET /api/videos/stream/:id`: Stream video content with range support.
- `DELETE /api/videos/:id`: Delete a video (Owner/Admin only).

## Architecture Overview

- **Storage**: Videos are stored locally in the `backend/uploads` directory.
- **Processing**: FFmpeg is used to extract video duration. A mock sensitivity analyzer simulates content screening.
- **Real-time**: Socket.io rooms are used to push progress updates to specific clients based on video ID.
- **Streaming**: The backend implements standard HTTP range request headers to support seekable video playback.
