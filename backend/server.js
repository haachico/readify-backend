const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const cookieParser = require('cookie-parser');
const allowedOrigins = ['http://localhost:3000', 'https://readify-lilac.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

// ===== Skip all body parsers for multipart/form-data (file uploads) =====
// This middleware must come FIRST, before any body parsing
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // If this is a multipart request, skip to routes directly
  // Multer will handle it
  if (contentType.includes('multipart/form-data')) {
    console.log('Skipping body parser for multipart request');
    return next();
  }
  
  // For non-multipart requests, apply both JSON and urlencoded parsers
  express.json({ limit: '50mb' })(req, res, () => {
    express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
  });
});

const loggerMiddleware = require('./src/middleware/loggerMiddleware');

app.use(loggerMiddleware);

// ===== Serve uploaded files as static files =====
// This allows /uploads/filename.png to be accessible via HTTP
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Debug middleware to check body
// app.use((req, res, next) => {
//   console.log('Request body:', req.body);
//   console.log('Content-Type:', req.headers['content-type']);
//   next();
// });

// Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);


const postRoutes = require('./src/routes/postRoutes');
app.use('/api/posts', postRoutes);


const commentRoutes = require('./src/routes/commentRoutes');
app.use('/api', commentRoutes);


const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const notificationRoutes = require('./src/routes/notificationRoutes');
const { startCronJobs } = require('./src/config/cron');
app.use('/api/notifications', notificationRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// CRON jobs - Commented out for now, can enable later
// startCronJobs();
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});