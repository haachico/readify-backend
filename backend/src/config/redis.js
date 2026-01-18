const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('✓ Redis Connected');
  } catch (err) {
    console.error('Redis Connection Error:', err);
  }
})();

module.exports = redisClient;
