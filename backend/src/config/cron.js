const cron = require('node-cron');
const pool = require('./db');
const emailService = require('../utils/emailService');
const Logger = require('../utils/logger');

// ===== CRON JOB: Delete expired reset tokens every hour =====
const startCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🕐 CRON: Starting expired token cleanup...');
      
      // Get count of expired tokens BEFORE deletion
      const [countBefore] = await pool.query(
        `SELECT COUNT(*) as count FROM users 
         WHERE reset_token IS NOT NULL 
         AND reset_token_expiry < NOW()`
      );
      
      const expiredCount = countBefore[0].count;
      
      // Delete expired tokens
      const result = await pool.query(
        `DELETE FROM users 
         WHERE reset_token IS NOT NULL 
         AND reset_token_expiry < NOW()`
      );
      
      const deletedCount = result[0].affectedRows;
      
      // Log to database
      await Logger.logInfo(
        `CRON: Deleted ${deletedCount} expired reset tokens`,
        'CRON_CLEANUP',
        'SCHEDULED',
        'SYSTEM',
        200,
        { expiredCount, deletedCount }
      );
      
      // Send email report
      const emailBody = `
        <h2>✅ Readify CRON Job Report</h2>
        <p><strong>Job:</strong> Expired Token Cleanup</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Expired Tokens Found:</strong> ${expiredCount}</p>
        <p><strong>Tokens Deleted:</strong> ${deletedCount}</p>
        <hr/>
        <p><em>This is an automated message from Readify Backend</em></p>
      `;
      
      await emailService.sendEmail(
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        `[CRON Report] Token Cleanup - ${deletedCount} tokens deleted`,
        emailBody
      );
      
      console.log(`✅ CRON: Cleanup complete. Deleted ${deletedCount} tokens`);
      
    } catch (error) {
      console.error('❌ CRON Error:', error);
      
      // Log error
      await Logger.logError(
        'CRON_CLEANUP_FAILED',
        'CRON_CLEANUP',
        'SCHEDULED',
        'SYSTEM',
        500,
        error
      );
      
      // Send error email
      await emailService.sendEmail(
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        '❌ [CRON FAILED] Token Cleanup Job Error',
        `<h2>Error occurred during CRON job</h2><p>${error.message}</p>`
      );
    }
  });
  
  console.log('✅ CRON jobs initialized');
};

module.exports = { startCronJobs };