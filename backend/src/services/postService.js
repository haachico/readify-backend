const pool = require('../config/db');
const redisClient = require('../config/redis');

// Helper function to format posts with likes and bookmarks
// async function formatPostsWithLikesAndBookmarks(posts, connection) {
//   return Promise.all(
//     posts.map(async (post) => {
//       const [likes] = await connection.query(
//         `SELECT userId FROM likes WHERE postId = ?`,
//         [post.id]
//       );

//       return {
//         _id: post.id,
//         content: post.content,
//         imgContent: post.imageUrl,
//         username: post.username,
//         firstName: post.firstName,
//         lastName: post.lastName,
//         email: post.email,
//         image: post.profileImage,
//         likes: {
//           likeCount: post.likeCount,
//           likedBy: likes.map(like => like.userId)
//         },
//         createdAt: post.createdAt,
//         updatedAt: post.updatedAt,
//         ...(post.isBookmarked !== undefined && { isBookmarked: post.isBookmarked === 1 })
//       };
//     })
//   );
// }

// Helper function to format posts with likes (for caching - no bookmark info)
// async function formatPostsWithLikes(posts, connection) {
//   return Promise.all(
//     posts.map(async (post) => {
//       const [likes] = await connection.query(
//         `SELECT userId FROM likes WHERE postId = ?`,
//         [post.id]
//       );

//       return {
//         _id: post.id,
//         content: post.content,
//         imgContent: post.imageUrl,
//         username: post.username,
//         firstName: post.firstName,
//         lastName: post.lastName,
//         email: post.email,
//         image: post.profileImage,
//         likes: {
//           likeCount: post.likeCount,
//           likedBy: likes.map(like => like.userId)
//         },
//         createdAt: post.createdAt,
//         updatedAt: post.updatedAt
//       };
//     })
//   );
// }

const postService = {
  async getAllPosts() {
    let connection;
    try {
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage,
        GROUP_CONCAT(l.userId) AS likedBy
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        LEFT JOIN likes as l ON l.postId = p.id
        GROUP BY p.id
        ORDER BY p.createdAt DESC`
      );

      const postsWithLikes = posts.map(post => ({
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
          likedBy: post.likedBy ? post.likedBy.split(',').map(Number) : []
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

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
      const cachedKey = 'trending:posts'

      const cachedPosts = await redisClient.get(cachedKey);

      if (cachedPosts) {
        return {
          message: 'Trending posts fetched successfully (from cache)',
          posts: JSON.parse(cachedPosts)
        };
      }
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage,
        GROUP_CONCAT(l.userId) AS likedBy
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        LEFT JOIN likes as l ON l.postId = p.id
        GROUP BY p.id
        ORDER BY p.likeCount DESC, p.createdAt DESC`
      );

      const postsWithLikes = posts.map(post => ({
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
          likedBy: post.likedBy ? post.likedBy.split(',').map(Number) : []
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

      await redisClient.set(cachedKey, JSON.stringify(postsWithLikes), { EX: 600 });
      console.log('✓ Cached trending posts for 10 minutes');
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
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage, 
        case when b.id is not null then 1 else 0 end as isBookmarked,
        GROUP_CONCAT(l.userId) AS likedBy
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
        LEFT JOIN likes as l ON l.postId = p.id
        WHERE p.userId = ? OR p.userId IN (
            SELECT followingId FROM follows WHERE followerId = ?
        )
        GROUP BY p.id
        ORDER BY ${orderBy}`,
        [userId, userId, userId]
      );

      const postsWithLikes = posts.map(post => ({
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
          likedBy: post.likedBy ? post.likedBy.split(',').map(Number) : []
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isBookmarked: post.isBookmarked === 1
      }));

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
      const cachedKey = `bookmarks:${userId}`;

      const cachedPosts = await redisClient.get(cachedKey);

      if (cachedPosts) {
        return {
          message: 'Bookmarked posts fetched successfully (from cache)',
          posts: JSON.parse(cachedPosts)
        };
      }
      connection = await pool.getConnection();

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage,
        GROUP_CONCAT(l.userId) AS likedBy
        FROM posts p
        INNER JOIN bookmarks b ON p.id = b.postId AND b.userId = ?
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN likes as l ON l.postId = p.id
        WHERE b.userId = ?
        GROUP BY p.id
        ORDER BY b.createdAt DESC`,
        [userId, userId]
      );

      const postsWithLikes = posts.map(post => ({
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
          likedBy: post.likedBy ? post.likedBy.split(',').map(Number) : []
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

      await redisClient.set(cachedKey, JSON.stringify(postsWithLikes), { EX: 600 });
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

      // Invalidate all feed caches for this user
      await redisClient.del(`feed:${userId}:latest`);
      await redisClient.del(`feed:${userId}:oldest`);
      await redisClient.del(`feed:${userId}:trending`);
      
      // Invalidate trending posts (new post affects ranking)
      await redisClient.del('trending:posts');
      
      console.log('✓ Cache invalidated for user:', userId);

      const [posts] = await connection.query(
        `SELECT p.id, p.content, p.imageUrl, p.userId, p.likeCount, p.createdAt, p.updatedAt, u.username, u.firstName, u.lastName, u.email, u.profileImage,
        GROUP_CONCAT(l.userId) AS likedBy
        FROM posts as p
        LEFT JOIN users as u ON p.userId = u.id
        LEFT JOIN likes as l ON l.postId = p.id
        Where p.userId = ?
        GROUP BY p.id
        ORDER BY p.createdAt DESC
        LIMIT 1`,
        [userId]
      );

      const postsWithLikes = posts.map(post => ({
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
          likedBy: post.likedBy ? post.likedBy.split(',').map(Number) : []
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

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

      await redisClient.del(`bookmarks:${userId}`); 
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

      await redisClient.del(`bookmarks:${userId}`);
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

           // Get post owner
      const [post] = await connection.query(
        `SELECT userId FROM posts WHERE id = ?`,
        [postId]
      );

      // Only create notification if liking someone else's post
      if (post[0].userId !== userId) {
        const [liker] = await connection.query(
          `SELECT username FROM users WHERE id = ?`,
          [userId]
        );

        // ✅ IMPROVEMENT: Check if notification already exists
        const [existingNotification] = await connection.query(
          `SELECT id FROM notifications 
           WHERE userId = ? AND type = 'like' 
           AND sourceUserId = ? AND postId = ? 
           AND DATE(createdAt) = CURDATE()`,
          [post[0].userId, userId, postId]
        );

        // ✅ Only insert if no recent duplicate
        if (existingNotification.length === 0) {
          const message = `${liker[0].username} liked your post.`;
          
          await connection.query(
            `INSERT INTO notifications 
             (userId, type, sourceUserId, postId, commentId, message, isRead, createdAt) 
             VALUES (?, 'like', ?, ?, NULL, ?, 0, NOW())`,
            [post[0].userId, userId, postId, message]
          );
        }
      }

      }

      // Invalidate trending posts cache (likes affect ranking)
      await redisClient.del('trending:posts');
      console.log('✓ Trending cache invalidated');

      return { message: 'Like/Dislike handled successfully' };
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = postService;
