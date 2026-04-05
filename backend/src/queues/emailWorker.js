const emailService = require('../utils/emailService');
const emailQueue = require('./emailQueue');

// Worker to process email jobs
emailQueue.process(async (job) => {
  try {
    const { type, data } = job.data;
    const attempt = job.attemptsMade + 1;
    console.log(`[Attempt ${attempt}/3] Processing email job: ${type}`, data);
    
    if (type === 'resetPassword') {
      const { email, resetToken, firstName } = data;
      await emailService.sendResetEmail(email, resetToken, firstName);
      console.log(`✅ Reset email sent successfully to ${email}`);
    }
  } catch (error) {
    const attempt = job.attemptsMade + 1;
    console.error(`❌ [Attempt ${attempt}/3] Email job error:`, error.message);
    throw error; // Rethrow to trigger retry or mark as failed
  }
});

// Handle job failures (after all retries exhausted)
emailQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} FAILED after all retries:`, error.message);
  console.error(`   Email: ${job.data.data.email}`);
});

// Handle job completions
emailQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

// Handle job retries
emailQueue.on('failed', (job, error) => {
  if (job.attemptsMade < job.opts.attempts) {
    console.warn(`⚠️ Job ${job.id} failed, retrying... (${job.attemptsMade}/${job.opts.attempts})`);
  }
});

console.log('Email queue worker started');
