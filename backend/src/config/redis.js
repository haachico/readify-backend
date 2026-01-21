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
      connectTimeout: 2000,  // Give up on connection after 2 seconds
      commandTimeout: 2000   // Give up on commands after 2 seconds
    },
  });

  redisClient.on('error', (err) => {
    // Silently mark as disconnected - errors are expected when Redis is unavailable
    // The app gracefully falls back to the database
    redisConnected = false;
  });

  (async () => {
    try {
      await redisClient.connect();
      redisConnected = true;
      console.log('✓ Redis connected');
      
      // Wrap Redis client methods with a 2-second timeout
      const original = redisClient;
      const timeout = 2000;
      
      ['get', 'set', 'del', 'incr', 'expire'].forEach(method => {
        const originalMethod = original[method].bind(original);
        original[method] = async function(...args) {
          return Promise.race([
            originalMethod(...args),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis command timeout')), timeout)
            )
          ]).catch(err => {
            redisConnected = false;
            console.warn(`⚠️  Redis command timeout, using database instead`);
            return null;
          });
        };
      });
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
