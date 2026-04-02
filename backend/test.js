// testEmail.js
const emailService = require("./src/utils/emailService");
require("dotenv").config();

async function testEmail() {
  try {
    const result = await emailService.sendEmail(
      "abhishek.chandravanshi@goqii.com", // Recipient email
      "Test Email from Readify", // Subject
      "<h1>Hello!</h1><p>This is a test email.</p>", // HTML content
    );
    console.log("✅ Test email sent successfully!");
    console.log(result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Test email failed:", error);
    process.exit(1);
  }
}

testEmail();
