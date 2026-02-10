const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authService = {
  async signup(username, email, password, firstName, lastName) {
    if (!username || !email || !password) {
      throw { status: 400, message: 'All fields are required' };
    }

    let connection;
    try {
      connection = await pool.getConnection();

      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser.length > 0) {
        throw { status: 422, message: 'User with this email or username already exists' };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await connection.query(
        'INSERT INTO users (username, email, password, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, firstName, lastName]
      );

      const [newUser] = await connection.query(
        'SELECT id, username, email, firstName, lastName FROM users WHERE email = ?',
        [email]
      );

      const accessToken = jwt.sign(
        { userId: newUser[0].id, username: newUser[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: newUser[0].id, username: newUser[0].username },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await connection.query(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [refreshToken, newUser[0].id]
      );

      return {
        createdUser: newUser[0],
        accessToken,
        refreshToken
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async login(email, password) {
    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required' };
    }

    let connection;
    try {
      connection = await pool.getConnection();

      const [users] = await connection.query(
        'SELECT id, username, profileImage, email, password, firstName, lastName FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw { status: 401, message: 'Invalid email or password' };
      }

      const user = users[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw { status: 401, message: 'Invalid email or password' };
      }

      const accessToken = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await connection.query(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [refreshToken, user.id]
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
        accessToken,
        refreshToken
      };
    } finally {
      if (connection) connection.release();
    }
  },

  async refreshToken(oldRefreshToken) {
    let connection;
    try {
      connection = await pool.getConnection();

      let payload;
      try {
        payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
      } catch {
        throw { status: 401, message: 'Invalid refresh token' };
      }

      const [users] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND refresh_token = ?',
        [payload.userId, oldRefreshToken]
      );

      if (users.length === 0) {
        throw { status: 401, message: 'Refresh token not found' };
      }

      const newAccessToken = jwt.sign(
        { userId: payload.userId, username: payload.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return { accessToken: newAccessToken };
    } finally {
      if (connection) connection.release();
    }
  }
  
  // async refreshToken(oldRefreshToken) {
  //   let connection;

  //   try {

  //     connection = await pool.getConnection();

  //     let payload;

  //     try {
  //       payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  //     }
  //     catch {
  //       throw { status: 401, message: 'Invalid refresh token' };
  //     }

  //     const [users] = await connection.query(
  //       `SELECT id from users where id = ? and refresh_token = ?`,
  //       [payload.userId, oldRefreshToken]
  //     );

  //     if (users.length === 0) {
  //       throw { status: 401, message: 'Refresh token not found' };
  //     }

  //     const newAccessToken = jwt.sign(
  //       { userId: payload.userId, username: payload.username },
  //       process.env.JWT_SECRET,
  //       { expiresIn: '15m' }
  //     )

  //     return { accessToken: newAccessToken };
  //   }
  //   finally {
  //     if (connection) connection.release();
  //   }
  // }
  
  ,

  async logout(userId) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query(
        'UPDATE users SET refresh_token = NULL WHERE id = ?',
        [userId]
      );
      return { message: 'Logged out successfully' };
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = authService;
