const { get } = require('../config/redis');
// const commentService = require('../services/commentService');

const {addComment, getCommnentsByPostId, deleteComment, addReply} = require('../services/commentService');


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
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error adding comment', error: error.message });
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
    
    const reply = await addReply({postId, commentId, userId, content});

    res.status(201).json({ message: 'Reply added', reply });
  }
  catch(error ){
    res.status(500).json({ message: 'Server error adding reply', error: error.message });
  }

},

 getCommnentsByPostId: async (req, res) => {
    try {
         const { postId } = req.params;
         const comments = await getCommnentsByPostId(postId);
         res.status(200).json(comments);
    }
    catch(error){
       res.status(500).json({ message: 'Server error fetching comments', error: error.message }); 
    }
 } ,

 deleteComment: async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        await deleteComment(commentId, postId);
        res.status(200).json({ message: 'Comment deleted' });
    }
    catch(error){
       res.status(500).json({ message: 'Server error deleting comment', error: error.message }); 
    }

}
}

module.exports = commentController;