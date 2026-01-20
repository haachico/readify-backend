const express = require('express');

const router = express.Router();
const {getAllPosts, getTrendingPosts, getBookmarkedPosts, createPost, editPost, bookmarkPost, removeBookmark, getFeedPosts, deletePost, handleLikeDislike} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const { rateLimitMiddleware } = require('../middleware/rateMiddleware');

router.get('/', getAllPosts);
router.get('/feed', authMiddleware, getFeedPosts);
router.post('/', authMiddleware, rateLimitMiddleware, createPost);
router.post('/edit/:postId', authMiddleware, editPost);
router.get('/trending', getTrendingPosts);
// router.get('/bookmarks', authMiddleware, getBookmarkedPosts);
router.get('/bookmarks',  getBookmarkedPosts);
router.post('/bookmarks/:postId', authMiddleware, rateLimitMiddleware, bookmarkPost);
router.post('/remove-bookmark/:postId', authMiddleware, rateLimitMiddleware, removeBookmark);
router.delete('/:postId', authMiddleware, deletePost);
router.post('/like/:postId', authMiddleware, rateLimitMiddleware, handleLikeDislike)

module.exports = router;
