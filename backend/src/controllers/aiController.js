const { improvePostText } = require("../services/aiService");

// Controller function to handle improve post request
const improvePost = async (req, res) => {
  try {
    // Extract the post text from request body
    const { text } = req.body;

    // Validate that text is provided
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Post text is required" });
    }

    // Call the AI service to improve the text
    const improvedText = await improvePostText(text);

    // Send back the improved text
    res.status(200).json({ improvedText });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to improve post" });
  }
};

module.exports = { improvePost };