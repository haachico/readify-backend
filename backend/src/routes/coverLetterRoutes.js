const express = require("express");
const router = express.Router();
const coverLetterController = require("../controllers/coverLetterController");
const authMiddleware = require("../middleware/authMiddleware");

// Weird route name for personal use
router.post(
  "/xyzab2025/send-cover-letter",
  authMiddleware,
  coverLetterController.sendCoverLetter,
);

module.exports = router;
