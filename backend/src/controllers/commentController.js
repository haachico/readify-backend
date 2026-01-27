const commentService = require('../services/commentService');


const commentController = {
 addComment: async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.auth.userId;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and postId are required' });
    }

    const comment = await commentService.addComment({
      postId,
      userId,
      content,
      parentCommentId: parentCommentId || null
    });
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error adding comment', error: error.message });
  }
}
}

module.exports = commentController;