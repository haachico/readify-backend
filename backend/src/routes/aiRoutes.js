const express = require("express");
const { improvePost } = require("../controllers/aiController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/improve-post", authMiddleware, improvePost);

module.exports = router;