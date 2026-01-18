const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authService = {
  async signup(username, email, password, firstName, lastName) {
    // Validate inputs
    if (!username || !email || !password) {
      throw {
        status: 400,
        message: 'All fields are required'
      };
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Check if user already exists
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? or username = ?',
        [email, username]
      );

      if (existingUser.length > 0) {
        throw {
          status: 422,
          message: 'User with this email or username already exists'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert new user
      await connection.query(
        'INSERT INTO users (username, email, password, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, firstName, lastName]
      );

      // Fetch created user
      const [newUser] = await connection.query(
        'SELECT id, username, email, firstName, lastName FROM users WHERE email = ?',
        [email]
      );

      // Generate JWT token
      const encodedToken = jwt.sign(
        { userId: newUser[0].id, username: newUser[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        createdUser: newUser[0],
        encodedToken
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async login(email, password) {
    // Validate inputs
    if (!email || !password) {
      throw {
        status: 400,
        message: 'Email and password are required'
      };
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Fetch user by email
      const [users] = await connection.query(
        'SELECT id, username, profileImage, email, password, firstName, lastName FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw {
          status: 401,
          message: 'Invalid email or password'
        };
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw {
          status: 401,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const encodedToken = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        foundUser: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        },
        encodedToken
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async logout(token) {
    const redisClient = require('../config/redis');
    
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      
      // Add token to blacklist for 7 days (604800 seconds = 7 * 24 * 60 * 60)
      await redisClient.set(`blacklist:${cleanToken}`, '1', { EX: 604800 });
      
      console.log('✓ Token added to blacklist');
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw {
        status: 500,
        message: 'Error during logout'
      };
    }
  }
};

module.exports = authService;
