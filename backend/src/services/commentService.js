const pool = require('../config/db');

// Add a new comment or reply



const buildCommentTree  = (comments)=> {
    let roots = [];
    let map = {};

    comments.forEach(comment => {
      comment.replies = [];
      map[comment.id] = comment;  
    })

    comments.forEach(comment => {
        if(comment.parentCommentId){
            
            let parent = map[comment.parentCommentId];
            
            if(parent){
                parent.replies.push(comment);
            }
        } else {
            roots.push(comment);
        }
    })

    return roots;
}

async function addComment({ postId, userId, content, parentCommentId = null }) {

    const [postCheck] = await pool.query(
    'SELECT id FROM posts WHERE id = ?',
    [postId]
  );
  if (postCheck.length === 0) {
    throw new Error('Post not found');
  }

  // Validate user exists
  const [userCheck] = await pool.query(
    'SELECT id FROM users WHERE id = ?',
    [userId]
  );
  if (userCheck.length === 0) {
    throw new Error('User not found');
  }

  if (parentCommentId) {
    const [parentCheck] = await pool.query(
      'SELECT id, postId FROM comments WHERE id = ?',
      [parentCommentId] 
    );
    if (parentCheck.length === 0) {
      throw new Error('Parent comment not found');
    }
    if (parentCheck[0].postId !== parseInt(postId)) {
      throw new Error('Parent comment does not belong to the same post');
    }
  }

  const [result] = await pool.query(
    `INSERT INTO comments (postId, userId, content, parentCommentId) 
     VALUES (?, ?, ?, ?)`,
    [postId, userId, content, parentCommentId]
  );

  const [comments] = await pool.query(
    `SELECT c.*, u.username 
     FROM comments c
     JOIN users u ON c.userId = u.id
     WHERE c.id = ?`,
    [result.insertId]
  );

  return comments[0];
}

async function addReply ({postId, userId, content, parentCommentId}) {
 
  let connection = await pool.getConnection()
  try {

      const [postCheck] = await connection.query(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (postCheck.length === 0) {
      throw new Error('Post not found');
    }

    const [userCheck] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      throw new Error('User not found');
    }

    const [parentCheck] = await connection.query(
      'SELECT id, postId FROM comments WHERE id = ?',
      [parentCommentId] 
    );

    if (parentCheck.length === 0) {
      throw new Error('Parent comment not found');
    }
    if (parentCheck[0].postId !== parseInt(postId)) {
      throw new Error('Parent comment does not belong to the same post');
    }

    const [result] = await connection.query(
      `INSERT INTO comments (postId, userId, content, parentCommentId) 
       VALUES (?, ?, ?, ?)`,
      [postId, userId, content, parentCommentId]
    );

    return result;
  }
  finally {
      connection.release();
  }


}

async function getCommnentsByPostId(postId) {
    
    let connection = await pool.getConnection()
    
    try {

        const post = await connection.query(
            `SELECT id FROM posts WHERE id = ?`,
            [postId]
        );
        if (post[0].length === 0) {
            throw new Error('Post not found');
        }
        const [rows] = await connection.query(
            `SELECT * FROM comments WHERE postId = ?`,
            [postId]
        );

       const rowsWithUsernames = await Promise.all(rows.map( async (comment)=> {
        const [userRow] = await connection.query(
            `SELECT username, profileImage FROM users WHERE id = ?`,
            [comment.userId]
        )
        return {
          ...comment, 
          username: userRow[0].username,
          profileImage: userRow[0].profileImage
        }
       }))
    
        return buildCommentTree(rowsWithUsernames);
    }
    finally {
        connection.release();
    }
    
}

async function deleteComment(commentId, postId) {
    
    let connection = await pool.getConnection()
    
    try {

        const comment = await connection.query(
            `SELECT id FROM comments WHERE id = ? AND postId = ?`,
            [commentId, postId]
        );

        if (comment[0].length === 0) {
            throw new Error('Comment not found');
        }

        await connection.query(
            `DELETE FROM comments WHERE id = ?`,
            [commentId]
        );

        return { message: 'Comment deleted successfully' };

    }
    finally {
        connection.release();
    }
}

module.exports = {
  addComment,
  getCommnentsByPostId,
  deleteComment,
  addReply
}