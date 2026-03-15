const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const emailService = require('../utils/emailService');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const formatUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  profileImage: user.profileImage,
  about: user.about,
  link: user.link,
});

const buildTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15min' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const generateBaseUsername = (email, firstName, lastName) => {
  const preferredUsername = [firstName, lastName].filter(Boolean).join('').trim();
  const fallbackUsername = (email || '').split('@')[0];
  const rawUsername = preferredUsername || fallbackUsername || 'user';

  return rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';
};

const generateUniqueUsername = async (connection, email, firstName, lastName) => {
  const baseUsername = generateBaseUsername(email, firstName, lastName);
  
  for (let suffix = 0; suffix <= 3; suffix++) {
    const username = suffix === 0 ? baseUsername : `${baseUsername}${suffix}`;
    
    const [rows] = await connection.query(
      'SELECT id FROM users WHERE username = ?', 
      [username]
    );
    
    if (rows.length === 0) {
      return username;
    }
  }
  
  return `${baseUsername}${Date.now()}`.slice(0, 24);
};

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

      const { accessToken, refreshToken } = buildTokens(user);

      await connection.query(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [refreshToken, user.id]
      );

      return {
        foundUser: formatUserResponse(user),
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

      console.log(payload, oldRefreshToken, "payload in refreshToken service");

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
        { expiresIn: '15min' }
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
  },

  async googleLogin(credential) {
    if (!credential) {
      throw { status: 400, message: 'Google credential is required' };
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw { status: 500, message: 'Google client ID is not configured' };
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw { status: 401, message: 'Invalid Google credential' };
    }

    if (!payload?.email || !payload.email_verified) {
      throw { status: 401, message: 'Google account email is not verified' };
    }

    const email = payload.email;
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const profileImage = payload.picture || null;

    let connection;
    try {
      connection = await pool.getConnection();

      const [existingUsers] = await connection.query(
        'SELECT id, username, email, firstName, lastName, profileImage, about, link FROM users WHERE email = ?',
        [email]
      );

      let user = existingUsers[0];

      if (!user) {
        const username = await generateUniqueUsername(connection, email, firstName, lastName);
        const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

        await connection.query(
          'INSERT INTO users (username, email, password, firstName, lastName, profileImage) VALUES (?, ?, ?, ?, ?, ?)',
          [username, email, placeholderPassword, firstName, lastName, profileImage]
        );

        const [createdUsers] = await connection.query(
          'SELECT id, username, email, firstName, lastName, profileImage, about, link FROM users WHERE email = ?',
          [email]
        );

        user = createdUsers[0];
      } else {
        const nextFirstName = user.firstName || firstName;
        const nextLastName = user.lastName || lastName;
        const nextProfileImage = user.profileImage || profileImage;

        if (
          nextFirstName !== user.firstName ||
          nextLastName !== user.lastName ||
          nextProfileImage !== user.profileImage
        ) {
          await connection.query(
            'UPDATE users SET firstName = ?, lastName = ?, profileImage = ? WHERE id = ?',
            [nextFirstName, nextLastName, nextProfileImage, user.id]
          );

          user = {
            ...user,
            firstName: nextFirstName,
            lastName: nextLastName,
            profileImage: nextProfileImage,
          };
        }
      }

      const { accessToken, refreshToken } = buildTokens(user);

      await connection.query(
        'UPDATE users SET refresh_token = ? WHERE id = ?',
        [refreshToken, user.id]
      );

      return {
        foundUser: formatUserResponse(user),
        accessToken,
        refreshToken,
      };
    } finally {
      if (connection) connection.release();
    }
  },

  
async forgotPassword(email) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, firstName FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw { status: 404, message: 'User not found' };
    }

    // Generate reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await connection.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [resetToken, expiryTime, email]
    );

    // Send email
    await emailService.sendResetEmail(email, resetToken, users[0].firstName);

    return { message: 'Reset email sent successfully' };
  } finally {
    if (connection) connection.release();
  }
},


async resetPassword(resetToken, newPassword) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [resetToken]
    );

    if (users.length === 0) {
      throw { status: 400, message: 'Invalid or expired reset token' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await connection.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    return { message: 'Password reset successfully' };
    
}

finally {
    if (connection) connection.release();
}

}
};

module.exports = authService;
