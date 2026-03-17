const express = require("express");
const { improvePost, validatePost } = require("../controllers/aiController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/improve-post", authMiddleware, improvePost);
router.post('/validate-post', authMiddleware, validatePost);
module.exports = router;