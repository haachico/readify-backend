const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let redisConnected = false;

// Only try to connect if REDIS_URL is set and not localhost
if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'),
      rejectUnauthorized: false,
      connectTimeout: 5000,  // 5 second timeout
    },
  });

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
} else {
  console.log('⚠️  Redis disabled (using localhost or REDIS_URL not set)');
  redisConnected = false;
  
  // Create a dummy client that does nothing
  redisClient = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    incr: async () => 0,
    expire: async () => null,
  };
}

module.exports = redisClient;
module.exports.isConnected = () => redisConnected;
