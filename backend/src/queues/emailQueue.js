const Bull = require('bull');
require('dotenv').config();

// Create a queue for email jobs
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const emailQueue = new Bull('email-queue', redisUrl);

module.exports = emailQueue;
