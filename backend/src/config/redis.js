const { createClient } = require('redis');
require('dotenv').config();

let redisClient;
let redisConnected = false;

// Dummy client that returns null/0 for all operations
const dummyClient = {
  get: async () => null,
  set: async () => null,
  del: async () => null,
  incr: async () => 0,
  expire: async () => null,
};

// Only try to connect to Redis if REDIS_URL is set
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false,
      connectTimeout: 2000  // Give up after 2 seconds
    },
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️  Redis unavailable (continuing without caching):', err.message);
    redisConnected = false;
  });

  (async () => {
    try {
      await redisClient.connect();
      redisConnected = true;
      console.log('✓ Redis connected');
    } catch (err) {
      console.warn('⚠️  Redis connection failed (app will work without caching):', err.message);
      redisConnected = false;
      // Fall back to dummy client
      redisClient = dummyClient;
    }
  })();
} else {
  // No REDIS_URL configured, use dummy client
  redisClient = dummyClient;
  console.log('ℹ️  Redis not configured (using dummy client)');
}

module.exports = redisClient;
module.exports.isConnected = () => redisConnected;
