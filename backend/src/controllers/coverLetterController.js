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


      const userId = req.auth.userId;
      

      if(userId !== parseInt(process.env.ADMIN_USER_ID)) {
        return res.status(403).json({ message: "Forbidden: You are not authorized to send cover letters." });
      }
      

      //i will put a check here if user is me then only allow to send cover letter otherwise return error
       

        const htmlContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #2c3e50; max-width: 650px; margin: 0 auto;">
            <p style="margin: 0 0 20px 0; font-size: 15px;">Dear Hiring Team,</p>
            
            <p style="margin: 0 0 18px 0; font-size: 15px;">I'm excited to apply for the <strong>${positionName}</strong> position at <strong>${companyName}</strong>. With <strong>2+ years of Software Development experience</strong>, I'm confident I can deliver immediate value to your team.</p>
            
            <p style="margin: 0 0 18px 0; font-size: 15px;">My technical expertise spans:</p>
            <ul style="margin: 0 0 18px 20px; padding: 0; font-size: 15px;">
              <li style="margin: 0 0 8px 0;"><strong>Frontend:</strong> React, JavaScript, TypeScript – building responsive, user-focused interfaces</li>
              <li style="margin: 0 0 8px 0;"><strong>Backend:</strong> Node.js, Express, PHP – designing scalable APIs and database systems with MySQL</li>
              <li style="margin: 0 0 0 0;"><strong>Full-cycle development</strong> – from architecture design through deployment</li>
            </ul>
            
            <p style="margin: 0 0 18px 0; font-size: 15px;">I thrive in collaborative environments, turning complex problems into elegant solutions across the entire stack. I'm committed to writing <strong>clean, maintainable code</strong> and staying current with emerging technologies.</p>
            
            <p style="margin: 0 0 20px 0; font-size: 15px;">I'd welcome the opportunity to discuss how my skills and passion for development can contribute to your team's success.</p>
            
            <div style="margin-top: 28px; border-top: 2px solid #e0e0e0; padding-top: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 15px;">Best regards,</p>
              <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 15px; color: #1a2a3a;">${SENDER_NAME}</p>
              
              <p style="margin: 0 0 5px 0; font-size: 14px;">
                <a href="tel:${SENDER_PHONE}" style="text-decoration: none; font-weight: 500;">${SENDER_PHONE}</a>
                <span style="margin: 0 5px; color: #bdbdbd;">•</span>
                <a href="mailto:${SENDER_EMAIL}" style="text-decoration: none; font-weight: 500;">${SENDER_EMAIL}</a>
              </p>
              
              <p style="margin: 0; font-size: 14px;">
                <a href="${LINKEDIN_URL}" style="text-decoration: none; font-weight: 500; margin-right: 5px;">LinkedIn</a>
                <span style="margin: 0 5px; color: #bdbdbd;">•</span>
                <a href="${GITHUB_URL}" style="text-decoration: none; font-weight: 500; margin: 0 5px;">GitHub</a>
                <span style="margin: 0 5px; color: #bdbdbd;">•</span>
                <a href="${CODEWARS_URL}" style="text-decoration: none; font-weight: 500; margin-left: 5px;">Codewars</a>
              </p>
            </div>
          </div>
        `;

      // Prepare resume attachment (if exists)
      // let attachments = [];
      // if (fs.existsSync(RESUME_PATH)) {
      //   attachments = [
      //     {
      //       filename: "resume.pdf",
      //       path: RESUME_PATH
      //     }
      //   ];
      // } else {
      //   console.warn(`Resume not found at: ${RESUME_PATH}`);
      // }

      const attachments = [
        {
          filename: "nileshSoftwareDev_cv.pdf",
          path: "https://ik.imagekit.io/0hvcvrxkp/nileshSoftwareDev_cv.pdf"
        }
      ];

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
