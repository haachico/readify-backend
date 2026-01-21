const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    // Force TLS if we are in production (Render)
    tls: true, 
    // This is the key fix for "packet length" on many cloud providers
    rejectUnauthorized: false, 
    // Add a timeout so it doesn't hang your API forever
    connectTimeout: 10000 
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
