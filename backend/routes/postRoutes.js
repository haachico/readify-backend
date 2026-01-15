const express = require('express');

const router = express.Router();
const {getAllPosts, getTrendingPosts, getBookmarkedPosts, createPost, editPost, bookmarkPost, removeBookmark, getFeedPosts} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getAllPosts);
router.get('/feed', authMiddleware, getFeedPosts);
router.post('/', authMiddleware, createPost);
router.post('/edit/:postId', authMiddleware, editPost);
router.get('/trending', getTrendingPosts);
router.get('/bookmarks', authMiddleware, getBookmarkedPosts);
router.post('/bookmarks/:postId', authMiddleware, bookmarkPost);
router.post('/remove-bookmark/:postId', authMiddleware, removeBookmark);

module.exports = router;