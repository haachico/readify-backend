const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { addComment, getCommnentsByPostId, deleteComment, addAReply } = require('../controllers/commentController');

// Add a new comment or reply to a post
// router.get('/test', (req, res) => res.send('Comment route working!'));

router.post('/posts/:postId/comments', authMiddleware, addComment);
router.get('/posts/:postId/comments', authMiddleware, getCommnentsByPostId);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, deleteComment);
router.post('/comments/:commentId/replies', authMiddleware, addAReply);

module.exports = router;
