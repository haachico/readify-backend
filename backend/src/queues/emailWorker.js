const Bull = require('bull');
const emailService = require('../utils/emailService');
const emailQueue = require('./emailQueue');

// Create Worker instance from the queue
const worker = new Bull.Worker('email-queue', async (job) => {
  try {
    const { type, data } = job.data;
    const attempt = job.attemptsMade + 1;
    console.log(`[Attempt ${attempt}/3] Processing email job: ${type}`, data);
    
    if (type === 'resetPassword') {
      const { email, resetToken, firstName } = data;
      await emailService.sendResetEmail(email, resetToken, firstName);
      console.log(`✅ Reset email sent successfully to ${email}`);
    } else if (type === 'coverLetter') {
      const { recipientEmail, companyName, positionName, htmlContent, attachments } = data;
      await emailService.sendEmail(
        recipientEmail,
        `Application - ${positionName} at ${companyName}`,
        htmlContent,
        attachments
      );
      console.log(`✅ Cover letter sent successfully to ${recipientEmail}`);
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }
  } catch (error) {
    const attempt = job.attemptsMade + 1;
    console.error(`❌ [Attempt ${attempt}/3] Email job error:`, error.message);
    throw error; // Rethrow to trigger retry or mark as failed
  }
}, {
  connection: emailQueue.client  
});

// Handle job failures (after all retries exhausted)
worker.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} FAILED after all retries:`, error.message);
  console.error(`   Email: ${job.data.data.email}`);
});

// Handle job completions
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

// Handle worker ready
worker.on('ready', () => {
  console.log('✅ Email Worker ready and listening for jobs');
});

// Handle worker errors
worker.on('error', (error) => {
  console.error('❌ Worker error:', error.message);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down email worker gracefully...');
  try {
    await worker.close();
    console.log('✅ Email worker closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('📧 Email queue worker initialized');

module.exports = worker;
