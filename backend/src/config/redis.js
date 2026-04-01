const { createClient } = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisConnected = false;

// Dummy client for fallback
const dummyClient = {
  get: async () => null,
  set: async () => null,
  del: async () => null,
  incr: async () => 0,
  expire: async () => null,
};

// Wrapper client that always has the correct methods
const safeClient = {
  get: async (...args) => {
    if (redisConnected && safeClient._real) {
      return safeClient._real.get(...args);
    }
    return dummyClient.get(...args);
  },
  set: async (...args) => {
    if (redisConnected && safeClient._real) {
      return safeClient._real.set(...args);
    }
    return dummyClient.set(...args);
  },
  del: async (...args) => {
    if (redisConnected && safeClient._real) {
      return safeClient._real.del(...args);
    }
    return dummyClient.del(...args);
  },
  incr: async (...args) => {
    if (redisConnected && safeClient._real) {
      return safeClient._real.incr(...args);
    }
    return dummyClient.incr(...args);
  },
  expire: async (...args) => {
    if (redisConnected && safeClient._real) {
      return safeClient._real.expire(...args);
    }
    return dummyClient.expire(...args);
  },
  isConnected: () => redisConnected
};

async function initRedis() {
  try {
    const client = createClient({ url: redisUrl });
    client.on('connect', () => {
      redisConnected = true;
      console.log('✓ Redis connected');
    });
    client.on('error', (err) => {
      redisConnected = false;
      console.error('⚠️  Redis connection error:', err.message);
    });
    await client.connect();
    safeClient._real = client;
  } catch (err) {
    console.error('⚠️  Redis unavailable, using dummy client:', err.message);
    safeClient._real = null;
  }
}

// Immediately try to connect
initRedis();

module.exports = safeClient;
