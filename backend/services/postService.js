const pool = require('../config/db');

// Helper function to format posts with likes
async function formatPostsWithLikes(posts, connection) {
  return Promise.all(
    posts.map(async (post) => {
      const [likes] = await connection.query(
        `SELECT userId FROM likes WHERE postId = ?`,
        [post.id]
      );

      return {
        _id: post.id,
        content: post.content,
        imgContent: post.imageUrl,
        username: post.username,
        firstName: post.firstName,
        lastName: post.lastName,
        email: post.email,
        image: post.profileImage,
        likes: {
          likeCount: post.likeCount,
          likedBy: likes.map(like => like.userId)
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        ...(post.isBookmarked !== undefined && { isBookmarked: post.isBookmarked === 1 })
      };
    })
  );
}

const postService = {
  async getAllPosts() {
    let connection;
    try {
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        ORDER BY p.createdAt DESC`
      );

      const postsWithLikes = await formatPostsWithLikes(posts, connection);

      return {
        message: 'Posts fetched successfully',
        posts: postsWithLikes
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async getTrendingPosts() {
    let connection;
    try {
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        ORDER BY p.likeCount DESC, p.createdAt DESC`
      );

      const postsWithLikes = await formatPostsWithLikes(posts, connection);

      return {
        message: 'Trending posts fetched successfully',
        posts: postsWithLikes
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async getFeedPosts(userId, sort = 'oldest') {
    let connection;
    try {
      connection = await pool.getConnection();

      let orderBy = 'p.createdAt ASC';
      if (sort === 'latest') {
        orderBy = 'p.createdAt DESC';
      }
      if (sort === 'trending') {
        orderBy = 'p.likeCount DESC';
      }

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage, case when b.id is not null then 1 else 0 end as isBookmarked
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
        WHERE p.userId = ? OR p.userId IN (
            SELECT followingId FROM follows WHERE followerId = ?
        )
        ORDER BY ${orderBy}`,
        [userId, userId, userId]
      );

      const postsWithLikes = await formatPostsWithLikes(posts, connection);

      return {
        message: 'Feed posts fetched successfully',
        posts: postsWithLikes
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async getBookmarkedPosts(userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
        FROM posts p
        INNER JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
        LEFT JOIN users u ON p.userId = u.id
        ORDER BY b.createdAt DESC`,
        [userId]
      );

      const postsWithLikes = await formatPostsWithLikes(posts, connection);

      return {
        message: 'Bookmarked posts fetched successfully',
        posts: postsWithLikes
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async createPost(content, imgContent, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      await connection.query(
        `INSERT INTO posts (content, imageUrl, userId, likeCount, createdAt, updatedAt) VALUES (?, ?, ?, 0, NOW(), NOW())`,
        [content, imgContent, userId]
      );

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        Where p.userId = ?
        ORDER BY p.createdAt DESC
        LIMIT 1`,
        [userId]
      );

      const postsWithLikes = await formatPostsWithLikes(posts, connection);

      return {
        message: 'Post created successfully',
        posts: postsWithLikes
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async editPost(postId, userId, content, imgContent) {
    let connection;
    try {
      connection = await pool.getConnection();

      // Check authorization
      const [posts] = await connection.query(
        `SELECT * FROM posts WHERE id = ? AND userId = ?`,
        [postId, userId]
      );

      if (posts.length === 0) {
        throw {
          status: 403,
          message: 'Post not found or unauthorized'
        };
      }

      await connection.query(
        `UPDATE posts SET content = ?, imageUrl = ?, updatedAt = NOW() WHERE id = ?`,
        [content, imgContent, postId]
      );

      return { message: 'Post updated successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

  async bookmarkPost(postId, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      await connection.query(
        `INSERT INTO bookmarks (userId, postId, createdAt) VALUES (?, ?, NOW())`,
        [userId, postId]
      );

      return { message: 'Post bookmarked successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

  async removeBookmark(postId, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      await connection.query(
        `DELETE FROM bookmarks WHERE userId = ? AND postId = ?`,
        [userId, postId]
      );

      return { message: 'Bookmark removed successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

  async deletePost(postId, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      // Check authorization
      const [posts] = await connection.query(
        `SELECT * FROM posts WHERE id = ? AND userId = ?`,
        [postId, userId]
      );

      if (posts.length === 0) {
        throw {
          status: 403,
          message: 'Post not found or unauthorized'
        };
      }

      await connection.query(
        `DELETE FROM posts WHERE id = ? AND userId = ?`,
        [postId, userId]
      );

      return { message: 'Post deleted successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

  async handleLikeDislike(postId, userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [likes] = await connection.query(
        `SELECT * FROM likes WHERE postId = ? AND userId = ?`,
        [postId, userId]
      );

      if (likes.length > 0) {
        await connection.query(
          `DELETE FROM likes WHERE postId = ? AND userId = ?`,
          [postId, userId]
        );
        await connection.query(
          `UPDATE posts SET likeCount = likeCount - 1 WHERE id = ?`,
          [postId]
        );
      } else {
        await connection.query(
          `INSERT INTO likes (postId, userId, createdAt) VALUES (?, ?, NOW())`,
          [postId, userId]
        );
        await connection.query(
          `UPDATE posts SET likeCount = likeCount + 1 WHERE id = ?`,
          [postId]
        );
      }

      return { message: 'Like/Dislike handled successfully' };
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = postService;
