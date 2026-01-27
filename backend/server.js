const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});