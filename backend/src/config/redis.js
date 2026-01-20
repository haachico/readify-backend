const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'),
    rejectUnauthorized: false,
  },
});

let redisConnected = false;

redisClient.on('error', (err) => {
  console.warn('⚠️  Redis Connection Warning (continuing without Redis):', err.message);
  redisConnected = false;
});

(async () => {
  try {
    await redisClient.connect();
    redisConnected = true;
    console.log('✓ Redis Connected');
  } catch (err) {
    console.warn('⚠️  Redis not available (app will work without caching):', err.message);
    redisConnected = false;
  }
})();

module.exports = redisClient;
module.exports.isConnected = () => redisConnected;
