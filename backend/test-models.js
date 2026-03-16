const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

(async () => {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.forEach(model => {
      console.log("- ", model.name);
    });
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
})();
