const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // Debug middleware to check body
// app.use((req, res, next) => {
//   console.log('Request body:', req.body);
//   console.log('Content-Type:', req.headers['content-type']);
//   next();
// });

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);


const userRoutes = require('./routes/userRoutes');
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