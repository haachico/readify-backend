const emailService = require("../utils/emailService");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Hardcoded cover letter template (for reference only)
const SENDER_NAME = process.env.SENDER_NAME || "Nilesh Kokare";
const SENDER_PHONE = process.env.SENDER_PHONE || "9653227842";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "nile10kokare@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/nilesh-kokare-92461b231/";
const GITHUB_URL = "https://github.com/haachico";
const CODEWARS_URL = "https://www.codewars.com/users/haachico";

// Path to your resume PDF (adjust path as needed)
const RESUME_PATH = path.join(__dirname, "../../", process.env.RESUME_PATH || "resume.pdf");

const coverLetterController = {
  async sendCoverLetter(req, res) {
    try {
      const { recipientEmail, companyName, positionName } = req.body;

      if (!recipientEmail || !companyName || !positionName) {
        return res.status(400).json({
          message:
            "Missing required fields: recipientEmail, companyName, positionName",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Create professional HTML cover letter
      const htmlContent = `
       <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a2a3a; max-width: 700px; margin: 0 auto;">
  <p style="margin: 0 0 16px 0;">Hi,</p>
  
  <p style="margin: 0 0 16px 0;">I'm writing to express my interest in the <strong style="font-weight: 700;">${positionName}</strong> role at <strong style="font-weight: 700;">${companyName}</strong>.</p>
  
  <p style="margin: 0 0 16px 0;">I have 2+ years of experience in software development working across the full stack. I build responsive frontends with React, JavaScript, and TypeScript, and develop backend systems with Node.js, Express, PHP, and MySQL.</p>
  
  <p style="margin: 0 0 16px 0;">In my current role, I work on the complete development cycle — designing and implementing features from the database layer through the API to the user interface. I enjoy collaborating with teams and solving problems that span multiple parts of the application.</p>
  
  <p style="margin: 0 0 16px 0;">I'm passionate about writing clean, maintainable code and continuously learning new technologies. I'm looking for an opportunity to grow my skills and take on more challenging projects.</p>
  
  <p style="margin: 0 0 16px 0;">Thank you for considering my application. I look forward to discussing how I can contribute to your team.</p>
  
  <!-- SIGNATURE SECTION - STYLED LIKE SECOND IMAGE -->
  <div style="margin-top: 32px;">
    <p style="margin: 0 0 2px 0;">Best regards,</p>
    <p style="margin: 0 0 2px 0; font-weight: 600; font-size: 12px;">${SENDER_NAME}</p>
    
    <!-- Contact line: Phone and email on same line with separator -->
    <p style="margin: 0 0 2px 0;">
      <a href="tel:${SENDER_PHONE}" style="color: #0066cc; text-decoration: none;">${SENDER_PHONE}</a>
      <span style="margin: 0 2px; color: #8a9aa8;">|</span>
      <a href="mailto:${SENDER_EMAIL}" style="color: #0066cc; text-decoration: none;">${SENDER_EMAIL}</a>
    </p>
    
    <!-- Social links line: LinkedIn | GitHub | Codewars -->
    <p style="margin: 0;">
      <a href="${LINKEDIN_URL}" style="color: #0066cc; text-decoration: none; margin-right: 2px;">LinkedIn</a>
      <span style="margin: 0 2px; color: #8a9aa8;">|</span>
      <a href="${GITHUB_URL}" style="color: #0066cc; text-decoration: none; margin: 0 2px 0 2px;">GitHub</a>
      <span style="margin: 0 2px; color: #8a9aa8;">|</span>
      <a href="${CODEWARS_URL}" style="color: #0066cc; text-decoration: none; margin-left: 2px;">Codewars</a>
    </p>
  </div>
</div>
      `;

      // Prepare resume attachment (if exists)
      let attachments = [];
      if (fs.existsSync(RESUME_PATH)) {
        attachments = [
          {
            filename: "resume.pdf",
            path: RESUME_PATH
          }
        ];
      } else {
        console.warn(`Resume not found at: ${RESUME_PATH}`);
      }

      await emailService.sendEmail(
        recipientEmail,
        `Application - ${positionName} at ${companyName}`,
        htmlContent,
        attachments
      );

      return res.status(200).json({
        success: true,
        message: `Cover letter sent successfully to ${recipientEmail}`,
      });
    } catch (error) {
      console.error("❌ Cover letter send error:", error);
      return res.status(500).json({
        message: "Failed to send cover letter: " + error.message,
      });
    }
  },
};

module.exports = coverLetterController;
