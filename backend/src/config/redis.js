const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let redisConnected = false;

// Dummy client that returns null/0 for all operations
const dummyClient = {
  get: async () => null,
  set: async () => null,
  del: async () => null,
  incr: async () => 0,
  expire: async () => null,
};

// Only try to connect to Redis if REDIS_URL is set and not localhost
async function initRedis() {
  if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost')) {
    redisClient = dummyClient;
    console.log('ℹ️  Redis not configured or localhost, using dummy client');
    return;
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
        connectTimeout: 1000  // Only wait 1 second
      },
    });

    // Set up a timeout for the connect attempt
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 1500)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    
    redisClient = client;
    redisConnected = true;
    console.log('✓ Redis connected');
  } catch (err) {
    console.log('⚠️  Redis unavailable, using database for all operations');
    redisClient = dummyClient;
    redisConnected = false;
  }
}

// Initialize Redis immediately
initRedis();

module.exports = redisClient;
module.exports.isConnected = () => redisConnected;
