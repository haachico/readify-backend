const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailService = {
  async sendResetEmail(email, resetToken, firstName) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Readify',
      html: `
        <h2>Hello ${firstName},</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      console.error('Error details:', error);
      throw { status: 500, message: 'Failed to send reset email: ' + error.message };
    }
  },
 
  async sendEmail(to, subject, html) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', to);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      console.error('Error details:', error);
      throw { status: 500, message: 'Failed to send email: ' + error.message };
    }
  }
};

module.exports = emailService;