const emailService = require("../utils/emailService");

// Hardcoded cover letter template
const COVER_LETTER_TEMPLATE = `Dear Hiring Manager,

I am writing to express my strong interest in the {positionName} position at {companyName}. With my comprehensive experience in full-stack web development, combined with my passion for creating scalable and user-centric applications, I am confident in my ability to contribute significantly to your team.

Throughout my professional journey, I have demonstrated expertise in modern web technologies including React.js, Node.js, Express, and MySQL. I have successfully developed and deployed multiple applications that have improved user engagement and operational efficiency. My experience spans across the entire development lifecycle, from conceptualization and design to implementation, testing, and deployment.

Key Strengths:
• Full-stack development proficiency (Frontend: React, HTML5, CSS3, JavaScript; Backend: Node.js, Express)
• Database design and optimization with MySQL and Redis
• RESTful API design and implementation
• Responsive and user-friendly UI/UX design
• Version control with Git and collaborative development
• Problem-solving and analytical thinking
• Quick learner and adaptable to new technologies

I am particularly drawn to {companyName} because of your innovative approach and commitment to excellence. I am excited about the opportunity to contribute my skills and grow with your organization. I am confident that my technical abilities, combined with my dedication and work ethic, make me an ideal candidate for this position.

Thank you for considering my application. I look forward to discussing how I can contribute to {companyName}'s continued success.

Sincerely,
Nilesh Kokare
nileshnkokare@gmail.com
+91 XXXXX XXXXX`;

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
