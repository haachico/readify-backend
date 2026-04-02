const emailService = require("../utils/emailService");
require("dotenv").config();

// Hardcoded cover letter template
const COVER_LETTER_TEMPLATE = `Hi,

I hope you're doing well.

I'm writing to express my interest in the {positionName} opportunity at {companyName}. I'm keen to apply for the role and be considered for your team.

I have 2+ years of professional experience in software development. In my current company, I work on the frontend using React, JavaScript, and TypeScript, building and maintaining user-facing features. On the backend, I work with PHP, handling APIs, business logic, and database interactions, along with MySQL for writing queries and managing data.

Alongside my professional work, I've built backend projects using Node.js and Express, where I developed REST APIs and handled authentication and database operations.

I'm comfortable working across the stack and would value the opportunity to contribute and grow in a MERN-focused role.

I've attached my resume for your review. I would appreciate the opportunity to discuss this further.

Thank you for your time and consideration.

Best regards,

${process.env.SENDER_NAME || "Nilesh Kokare"}

${process.env.SENDER_PHONE || "9653227842"}

${process.env.SENDER_EMAIL || "nile10kokare@gmail.com"}

LinkedIn: https://www.linkedin.com/in/nilesh-kokare-92461b231/ | GitHub: https://github.com/haachico | Codewars: https://www.codewars.com/users/haachico`;

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

      // Replace placeholders in cover letter
      let coverLetterText = COVER_LETTER_TEMPLATE.replace(
        /{companyName}/g,
        companyName,
      ).replace(/{positionName}/g, positionName);

      // Send email
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Application for ${positionName} at ${companyName}</h2>
          <div style="white-space: pre-wrap; margin: 20px 0;">
${coverLetterText}
          </div>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            <em>Sent via Readify - Cover Letter Sender</em>
          </p>
        </div>
      `;

      await emailService.sendEmail(
        recipientEmail,
        `Application - ${positionName} at ${companyName}`,
        htmlContent,
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
