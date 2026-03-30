const express = require("express");

const router = express.Router();
const {
  getAllPosts,
  getPostsByUserId,
  getTrendingPosts,
  getBookmarkedPosts,
  createPost,
  editPost,
  bookmarkPost,
  removeBookmark,
  getFeedPosts,
  deletePost,
  handleLikeDislike,
  getPostDetailsById,
} = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware");
const { rateLimitMiddleware } = require("../middleware/rateMiddleware");
const {
  upload,
  uploadToImageKit,
} = require("../middleware/imagekitMiddleware");

router.get("/", authMiddleware, getAllPosts);
router.get("/feed", authMiddleware, getFeedPosts);
router.post(
  "/",
  authMiddleware,
  rateLimitMiddleware,
  upload.single("image"),
  uploadToImageKit,
  createPost,
);

router.get('/user/:userId', authMiddleware, getPostsByUserId);
router.post(
  "/edit/:postId",
  authMiddleware,
  upload.single("image"),
  uploadToImageKit,
  editPost,
);
router.get("/trending", authMiddleware, getTrendingPosts);
router.get("/bookmarks", authMiddleware, getBookmarkedPosts);
router.get("/bookmarks", authMiddleware, getBookmarkedPosts);
router.post(
  "/bookmarks/:postId",
  authMiddleware,
  rateLimitMiddleware,
  bookmarkPost,
);
router.post(
  "/remove-bookmark/:postId",
  authMiddleware,
  rateLimitMiddleware,
  removeBookmark,
);
router.delete("/:postId", authMiddleware, deletePost);
router.post(
  "/like/:postId",
  authMiddleware,
  rateLimitMiddleware,
  handleLikeDislike,
);


router.get("/:postId", authMiddleware, getPostDetailsById);

module.exports = router;
