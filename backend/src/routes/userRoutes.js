const express = require("express");

const router = express.Router();

const {
  getAllUsers,
  getUserByUsername,
  followUser,
  searchUsers,
  updateProfile,
  getFollowersList,
  getFollowingsList,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadToImageKit,
  upload,
} = require("../middleware/imagekitMiddleware");

router.get("/", getAllUsers);
router.post("/follow", authMiddleware, followUser);
router.get("/search", searchUsers);
router.get("/:username", getUserByUsername);
router.post(
  "/updateProfile",
  authMiddleware,
  upload.single("profileImage"),
  uploadToImageKit,
  updateProfile,
);
router.get("/getFollowers/:userId", authMiddleware, getFollowersList);
router.get("/getFollowing/:userId", authMiddleware, getFollowingsList);

module.exports = router;
