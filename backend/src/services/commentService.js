const pool = require('../config/db');

// Add a new comment or reply
async function addComment({ postId, userId, content, parentCommentId = null }) {
  const [result] = await pool.query(
    `INSERT INTO comments (postId, userId, content, parentCommentId) VALUES (?, ?, ?, ?)`,
    [postId, userId, content, parentCommentId]
  );
  return {
    id: result.insertId,
    postId,
    userId,
    content,
    parentCommentId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

module.exports = {
  addComment,
};
