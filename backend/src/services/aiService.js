const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

// Function to improve post text using Google Gemini
const improvePostText = async (postText) => {
  try {
    // Get the Gemini model (gemini-1.5-pro is the current stable model)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create a prompt that tells Gemini what to do
    const prompt = `Improve this social media post. Make it more engaging, clear, and compelling while keeping the original meaning. Only return the improved text, no explanations:

"${postText}"`;

    // Send the prompt to Gemini and get the response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedText = response.text();

    // Return the improved text
    return improvedText;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

module.exports = { improvePostText };