const pool = require('../config/db');
const redisClient = require('../config/redis');

const userService = {
  async getAllUsers() {
    let connection;
    try {
      connection = await pool.getConnection();
      const [users] = await connection.query(
        'SELECT * FROM users ORDER BY username ASC'
      );

      return {
        message: 'Users fetched successfully',
        users: users
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async getUserByUsername(username) {
    let connection;
    try {
      const cachedKey = `user:${username}`;
      const cachedUser = await redisClient.get(cachedKey);

      if (cachedUser) {
        return {
          message: 'User fetched successfully (from cache)',
          user: JSON.parse(cachedUser)
        };
      }

      connection = await pool.getConnection();
      const [users] = await connection.query(
        `SELECT 
          u.*,
          COUNT(DISTINCT f1.id) as followers,
          COUNT(DISTINCT f2.id) as followings
        FROM users as u 
        LEFT JOIN follows f1 ON f1.followingId = u.id
        LEFT JOIN follows f2 ON f2.followerId = u.id
        WHERE u.username = ?
        GROUP BY u.id`,
        [username]
      );

      if (users.length === 0) {
        throw {
          status: 404,
          message: 'User not found'
        };
      }


      await redisClient.set(cachedKey, JSON.stringify(users[0]), { EX: 3600 }); // Cache for 5 minutes
      return {
        message: 'User fetched successfully',
        user: users[0]
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async searchUsers(query) {
    // Validate query
    if (!query || query.trim() === '') {
      return {
        message: 'No search query provided',
        users: []
      };
    }

    let connection;
    try {
      connection = await pool.getConnection();
      const [users] = await connection.query(
        `SELECT * FROM users 
         WHERE username LIKE ? OR firstName LIKE ? OR lastName LIKE ? 
         ORDER BY username ASC 
         LIMIT 10`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );

      return {
        message: 'Users found',
        users: users
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async followUser(followerId, followingId) {
    // Prevent self-follow
    if (followerId === followingId) {
      throw {
        status: 400,
        message: 'You cannot follow yourself'
      };
    }

    let connection;
    try {
      connection = await pool.getConnection();
      const [existingFollow] = await connection.query(
        'SELECT id FROM follows WHERE followerId = ? AND followingId = ?',
        [followerId, followingId]
      );

      if (existingFollow.length > 0) {
        // Unfollow
        await connection.query(
          'DELETE FROM follows WHERE followerId = ? AND followingId = ?',
          [followerId, followingId]
        );
      } else {
        // Follow
        await connection.query(
          'INSERT INTO follows (followerId, followingId) VALUES (?, ?)',
          [followerId, followingId]
        );
      }

      return { message: 'Follow/unfollow action completed successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

  async updateProfile(userId, profileImage, about, link) {
    let connection;
    try {
      connection = await pool.getConnection();

      await connection.query(
        'UPDATE users SET profileImage = ?, about = ?, link = ? WHERE id = ?',
        [profileImage, about, link, userId]
      );

      await redisClient.del(`user:${userId}`); // Invalidate cached user data
      return { message: 'Profile updated successfully' };
    } finally {
      if (connection) connection.release();
    }
  },

    
  async getFollowers(userId) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [userRows] = await connection.query(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      if (userRows.length === 0) {
        throw {
          status: 404,
          message: 'User not found'
        };
      }
      
      const [followedUsers] = await connection.query(
        `SELECT u.* from users as u
        Join follows as f
        on f.followerId = u.id
        WHERE f.followingId = ?
        `, [userId]
      )

      return followedUsers
    }

    finally {
      if (connection) connection.release();
    }
  },


  async getFollowings(userId) {
    let connection;
      try {

        connection = await pool.getConnection();

        const [userRows] = await connection.query(
          `SELECT * FROM users WHERE id = ?`,
          [userId]
        );

        if (userRows.length === 0) {
          throw {
            status: 404,
            message: 'User not found'
          };
        }
        
        const [followingUsers] = await connection.query(
          `Select u.* from users as u
          Join follows as f
          on f.followingId = u.id
          WHERE f.followerId = ?
          `, [userId]
        )
        return followingUsers

      }
      finally{
        if (connection) connection.release();
      }
  }
};

module.exports = userService;
