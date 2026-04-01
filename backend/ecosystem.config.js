module.exports = {
  apps: [
    {
      name: 'readify-backend',
      script: './server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'email-worker',
      script: './src/queues/emailWorker.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
