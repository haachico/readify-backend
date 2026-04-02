const express = require("express");
const router = express.Router();
const coverLetterController = require("../controllers/coverLetterController");

// Weird route name for personal use
router.post(
  "/xyzab2025/send-cover-letter",
  coverLetterController.sendCoverLetter,
);

module.exports = router;
