const emailService = require('../utils/emailService');
const emailQueue = require('./emailQueue');

// Worker to process email jobs
emailQueue.process(async (job) => {
  try {
    const { type, data } = job.data;
    console.log(`Processing email job: ${type}`, data);
    
    if (type === 'resetPassword') {
      const { email, resetToken, firstName } = data;
      await emailService.sendResetEmail(email, resetToken, firstName);
      console.log(`Reset email sent successfully to ${email}`);
    }
  } catch (error) {
    console.error('Email job error:', error.message);
    throw error; // Rethrow to mark job as failed
  }
});

// Handle job failures
emailQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

// Handle job completions
emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

console.log('Email queue worker started');
