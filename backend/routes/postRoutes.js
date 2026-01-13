const express = require('express');

const router = express.Router();
const {getAllPosts, getTrendingPosts, getBookmarkedPosts} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getAllPosts);
router.get('/trending', getTrendingPosts);
router.get('/bookmarks', authMiddleware, getBookmarkedPosts);

module.exports = router;