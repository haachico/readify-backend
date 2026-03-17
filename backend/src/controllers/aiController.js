const { improvePostText, validateBookContent } = require("../services/aiService");

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


const validatePost = async(req, res)=> {
  try {

    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Post text is required" });
    }

    const isBookRelated  = await validateBookContent(text);

    res.status(200).json({ isBookRelated });

  }
  catch(error){
    console.error("Validation Error:", error);
    res.status(500).json({ error: "Failed to validate post" });
  }
}

module.exports = { improvePost, validatePost };