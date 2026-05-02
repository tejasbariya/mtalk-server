import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { connectDB, requireDB, dbReady } from './src/config/db.js';
import { apiLimiter, authLimiter } from './src/middleware/rateLimiter.js';
import { setupChatSockets } from './src/sockets/chatSockets.js'; 
import libraryRoutes from './src/routes/libraryRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import titleRoutes from './src/routes/titleRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import friendRoutes from './src/routes/friendRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';

dotenv.config();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in .env');
    process.exit(1);
}
if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: MONGO_URI required for production');
    process.exit(1);
}
if (!process.env.CLIENT_URL) {
    console.error('❌ FATAL: CLIENT_URL not set in .env');
    process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
    console.error('❌ FATAL: PORT not set in .env for production');
    process.exit(1);
}

const app = express();
const httpServer = http.createServer(app);

// trust first proxy (if behind a reverse proxy like Nginx or Heroku) for correct IP and secure cookies
app.set('trust proxy', 1);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 1. Connect Database
connectDB();

// 2. Setup Express REST Routes
app.use('/api/', apiLimiter); // Apply general API rate limiter to all /api routes
app.use('/api/auth', requireDB, authLimiter, authRoutes);
app.use('/api/library', requireDB, apiLimiter, libraryRoutes);
app.use('/api/chat', requireDB, apiLimiter, chatRoutes);
app.use('/api/titles', requireDB, apiLimiter, titleRoutes);
app.use('/api/profile', requireDB, apiLimiter, profileRoutes);
app.use('/api/comments', requireDB, apiLimiter, commentRoutes);

app.get('/api/ping', (_req, res) => res.json({ ok: true, db: dbReady }));

// 3. Setup WebSockets
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

const verifyToken = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing token'));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Invalid token'));
    socket.userId = decoded.id; // Store user ID from token
    next();
  });
};

io.use(verifyToken);

// Pass the io instance into your separate file!
setupChatSockets(io); 

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  httpServer.close(async () => {
    await mongoose.connection.close();
    console.log('✅  Server closed.');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀  Server → http://localhost:${PORT}`)
);