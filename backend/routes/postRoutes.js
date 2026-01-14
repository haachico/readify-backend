const express = require('express');

const router = express.Router();
const {getAllPosts, getTrendingPosts, getBookmarkedPosts, createPost, editPost} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getAllPosts);
router.post('/', authMiddleware, createPost);
router.post('/edit/:postId', authMiddleware, editPost);
router.get('/trending', getTrendingPosts);
router.get('/bookmarks', authMiddleware, getBookmarkedPosts);

module.exports = router;