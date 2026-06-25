console.log('--- SERVER.JS IS STARTING ---');
process.on('uncaughtException', (err) => {
  console.error('\n!!! CRITICAL UNCAUGHT EXCEPTION !!!\n', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n!!! CRITICAL UNHANDLED REJECTION !!!\n', reason);
});
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const { doctorRouter, patientRouter, adminRouter, reportRouter, prescriptionRouter, aiRouter, notificationRouter, consultationRouter, symptomRouter, paymentRouter, insuranceRouter, dietRouter } = require('./routes/index');
const medicalRoutes = require('./routes/medical');
const schedulerService = require('./services/schedulerService');

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const app = express();
const server = http.createServer(app);

// ===========================
// CORS Configuration
// ===========================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'https://ai-healthcare-rosy.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the explicitly allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Dynamically allow any vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Dynamically allow Render frontend (if deployed there)
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ===========================
// SOCKET.IO - Real-time
// ===========================
const io = new Server(server, {
  cors: { origin: corsOptions.origin, methods: ['GET', 'POST'], credentials: true },
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('send_message', ({ to, message }) => {
    io.to(`user_${to}`).emit('receive_message', message);
  });

  // WebRTC Video Consultation Signaling
  socket.on('join-consultation-room', ({ roomId, userId, role }) => {
    socket.join(`consultation_${roomId}`);
    logger.info(`User ${userId} (${role}) joined consultation room ${roomId}`);
    // Notify others in the room
    socket.to(`consultation_${roomId}`).emit('user-connected', { userId, role, socketId: socket.id });
  });

  socket.on('webrtc-offer', ({ roomId, offer, senderId }) => {
    socket.to(`consultation_${roomId}`).emit('webrtc-offer', { offer, senderId });
  });

  socket.on('webrtc-answer', ({ roomId, answer, senderId }) => {
    socket.to(`consultation_${roomId}`).emit('webrtc-answer', { answer, senderId });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate, senderId }) => {
    socket.to(`consultation_${roomId}`).emit('webrtc-ice-candidate', { candidate, senderId });
  });

  socket.on('consultation-chat-message', ({ roomId, message }) => {
    io.to(`consultation_${roomId}`).emit('consultation-chat-message', message);
  });

  socket.on('end-consultation', ({ roomId }) => {
    io.to(`consultation_${roomId}`).emit('consultation-ended');
  });

  socket.on('disconnect', () => {
    connectedUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) connectedUsers.delete(userId);
    });
    // For WebRTC: Let peers know this socket left
    // Socket automatically leaves rooms on disconnect, but we can't easily broadcast to those rooms unless we tracked them.
    // However, RTCPeerConnection usually handles abrupt disconnects via ICE connection state changes locally on the client.
  });
});

// Make io available in controllers
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// ===========================
// MIDDLEWARE
// ===========================

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// HTTP logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// Sanitize input (prevent NoSQL injection)
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Auth-specific limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, please try again after 15 minutes' },
});

// ===========================
// ROUTES
// ===========================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏥 HealthCare AI API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRouter);
app.use('/api/patients', patientRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportRouter);
app.use('/api/prescriptions', prescriptionRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/consultations', consultationRouter);
app.use('/api/symptoms', symptomRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/insurance', insuranceRouter);
app.use('/api/diet', dietRouter);
app.use('/api/medical', medicalRoutes);

// Serve uploads directory (fallback for local uploads in dev)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Bind to port first so Render's port scanner passes immediately
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n==================================================`);
      console.log(`🏥 HealthCare AI Backend`);
      console.log(`🚀 Server listening on: http://0.0.0.0:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`==================================================\n`);
      logger.info(`Server bound to port ${PORT}`);
    });

    logger.info('Connecting to MongoDB...');
    await connectDB();

    // Start scheduler (only in production/staging)
    if (process.env.NODE_ENV !== 'test') {
      schedulerService.init(io);
    }

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    console.error(`\n!!! SERVER STARTUP FAILED !!!\n`, error);
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
