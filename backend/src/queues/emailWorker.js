const emailService = require('../utils/emailService');
const emailQueue = require('./emailQueue');

// Worker to process email jobs
emailQueue.process(async (job) => {
  const { type, data } = job.data;
  if (type === 'resetPassword') {
    const { email, resetToken, firstName } = data;
    await emailService.sendResetEmail(email, resetToken, firstName);
  }
  // Add more email types if needed
});

console.log('Email queue worker started');
