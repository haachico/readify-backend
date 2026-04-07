const { get } = require('../config/redis');
// const commentService = require('../services/commentService');

const {addComment, getCommnentsByPostId, deleteComment, addReply} = require('../services/commentService');
const Logger = require('../utils/logger');


const commentController = {

 addComment: async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.auth.userId;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and postId are required' });
    }

    const comment = await addComment({
      postId,
      userId,
      content,
      parentCommentId: parentCommentId || null
    });
    await Logger.logInfo(
      `User added comment`,
      `/api/posts/:postId/comments`,
      'POST',
      req.ipAddress,
      201,
      { userId, postId, commentId: comment.id }
    );
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    const status = error.status || 500;
    await Logger.logError(
      `Failed to add comment`,
      `/api/posts/:postId/comments`,
      'POST',
      req.ipAddress,
      status,
      error
    );
    res.status(status).json({ message: 'Server error adding comment', error: error.message });
  }
},

addAReply : async (req, res) => {

  try {
    const { commentId } = req.params;
    const { content, postId } = req.body;
    const userId = req.auth.userId;

    if (!content || !commentId) {
      return res.status(400).json({ message: 'Content and commentId are required' });
    }
    
    const reply = await addReply({postId, userId, content, commentId});
    await Logger.logInfo(
      `User added reply to comment`,
      `/api/comments/:commentId/reply`,
      'POST',
      req.ipAddress,
      201,
      { userId, commentId, postId }
    );

    res.status(201).json({ message: 'Reply added', reply });
  }
  catch(error ){
    const status = error.status || 500;
    await Logger.logError(
      `Failed to add reply`,
      `/api/comments/:commentId/reply`,
      'POST',
      req.ipAddress,
      status,
      error
    );
    res.status(status).json({ message: 'Server error adding reply', error: error.message });
  }

},

 getCommnentsByPostId: async (req, res) => {
    try {
         const { postId } = req.params;
         const comments = await getCommnentsByPostId(postId);
         res.status(200).json(comments);
    }
    catch(error){
       const status = error.status || 500;
       res.status(status).json({ message: 'Server error fetching comments', error: error.message }); 
    }
 } ,

 deleteComment: async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        await deleteComment(commentId, postId);
        await Logger.logInfo(
          `User deleted comment`,
          `/api/posts/:postId/comments/:commentId`,
          'DELETE',
          req.ipAddress,
          200,
          { userId: req.auth.userId, postId, commentId }
        );
        res.status(200).json({ message: 'Comment deleted' });
    }
    catch(error){
       await Logger.logError(
         `Failed to delete comment`,
         `/api/posts/:postId/comments/:commentId`,
         'DELETE',
         req.ipAddress,
         500,
         error
       );
       res.status(500).json({ message: 'Server error deleting comment', error: error.message }); 
    }

}
}

module.exports = commentController;