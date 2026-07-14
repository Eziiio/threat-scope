import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import investigationRoutes from './routes/investigationRoutes.js';
import threatFeedRoutes from './routes/threatFeedRoutes.js';
import savedIOCRoutes from './routes/savedIOCRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorMiddleware.js';

const app = express();

// Request logging (only in development or non-testing environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Security headers setup
app.use(helmet());

// CORS configuration - allowing credentials for secure cookies
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply global API limiter to other api routes (auth routes will use the stricter authLimiter)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/threat-feed', threatFeedRoutes);
app.use('/api/saved-iocs', protect, apiLimiter, savedIOCRoutes);
app.use('/api', protect, apiLimiter, investigationRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ThreatScope Backend API is running successfully',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Catch-all route for unhandled endpoints
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handler
app.use(errorHandler);

export default app;
