import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import dns from 'dns';

import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { initSocket } from './config/socket.js';

// Setup file paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Load env variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.CLIENT_URL
].filter(Boolean);

// Enable CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static folder for file/media uploads
app.use('/uploads', express.static(uploadsDir));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the FRANXX API Server' });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP Server for Socket.io mapping
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, process.env.CLIENT_URL);

server.listen(PORT, () => {
  console.log(
    `FRANXX API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});
