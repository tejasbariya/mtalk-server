import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import libraryRoutes from './routes/library.js';
import ChatMessage from './models/ChatMessage.js';

dotenv.config();

// ─── App & Server ────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logger (dev) ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ─── Socket.io ───────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

// To track online members per room
const roomMembers = {}; // { [room]: { [socketId]: { username, avatar } } }

// ─── MongoDB — resilient connection with retry ────────────────
let MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
  console.warn('⚠️   MONGO_URI missing or unpopulated — using local MongoDB.');
  MONGO_URI = 'mongodb://127.0.0.1:27017/mtalk';
}

// Track connection state so routes can return a friendly error
let dbReady = false;

const connectDB = async (attempt = 1) => {
  const maxAttempts = 10;
  const delay = Math.min(1000 * 2 ** (attempt - 1), 30000); // exponential up to 30s

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    dbReady = true;
    const label = MONGO_URI.includes('@')
      ? MONGO_URI.split('@')[1].split('/')[0]
      : MONGO_URI;
    console.log(`✅  MongoDB connected → ${label}`);
  } catch (err) {
    dbReady = false;
    console.error(`❌  MongoDB attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
    if (attempt < maxAttempts) {
      console.log(`    Retrying in ${delay / 1000}s…`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error('    Giving up after max retries. The server stays running but DB-dependent routes will return 503.');
    }
  }
};

// Re-connect on unexpected drop
mongoose.connection.on('disconnected', () => {
  dbReady = false;
  console.warn('⚠️  MongoDB disconnected — attempting to reconnect…');
  connectDB();
});
mongoose.connection.on('reconnected', () => {
  dbReady = true;
  console.log('✅  MongoDB reconnected');
});

connectDB();

// ─── Middleware: guard routes when DB is unavailable ─────────
export const requireDB = (_req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please try again in a moment.',
    });
  }
  next();
};

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',    requireDB, authRoutes);
app.use('/api/library', requireDB, libraryRoutes);

// Health-check — always responds even if DB is down
app.get('/api/ping', (_req, res) =>
  res.json({ ok: true, db: dbReady, time: new Date().toISOString() })
);

// 404 handler
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

// Global error handler — never leak stack traces to the client
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
});

// ─── Socket.io Events ────────────────────────────────────────
io.on('connection', (socket) => {
  
  socket.on('join_global', (userData) => {
    const room = 'global';
    socket.join(room);
    
    // Track member
    if (userData && userData.username) {
      if (!roomMembers[room]) roomMembers[room] = {};
      roomMembers[room][socket.id] = userData;
      io.to(room).emit('room_members', Object.values(roomMembers[room]));
    }
  });

  socket.on('get_history', async (room) => {
    try {
      const messages = await ChatMessage.find({ room })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('user', 'username avatar karma');
      
      socket.emit('chat_history', messages.reverse());
    } catch (err) {
      console.error('[SOCKET_HISTORY_ERROR]', err);
    }
  });

  socket.on('join_title', (data) => {
    // data could be { id, user }
    const roomId = `title_${data.id}`;
    socket.join(roomId);
    
    if (data.user && data.user.username) {
      if (!roomMembers[roomId]) roomMembers[roomId] = {};
      roomMembers[roomId][socket.id] = data.user;
      io.to(roomId).emit('room_members', Object.values(roomMembers[roomId]));
    }
  });

  socket.on('send_message', async (data) => {
    const room = data.room === 'global' ? 'global' : `title_${data.room}`;
    
    try {
      // Persist to DB
      const newMessage = await ChatMessage.create({
        room,
        user: data.user.id,
        text: data.text
      });
      
      // Emit with populated data (or just data if you already have it)
      io.to(room).emit('receive_message', {
        ...data,
        _id: newMessage._id,
        createdAt: newMessage.createdAt
      });
    } catch (err) {
      console.error('[SOCKET_SEND_ERROR]', err);
    }
  });

  socket.on('disconnecting', () => {
    // Remove user from all rooms they were tracked in
    socket.rooms.forEach(room => {
      if (roomMembers[room] && roomMembers[room][socket.id]) {
        delete roomMembers[room][socket.id];
        io.to(room).emit('room_members', Object.values(roomMembers[room]));
      }
    });
  });
});

// ─── Graceful shutdown ────────────────────────────────────────
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

// Prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
});

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀  Server → http://localhost:${PORT}`)
);
