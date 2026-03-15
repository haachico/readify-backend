const authService = require('../services/authService');
const Logger = require('../utils/logger');

const authController = {
  logout: async (req, res) => {
    try {
      const userId = req.auth.userId;  
      await authService.logout(userId);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false, // Set to true only for HTTPS
        sameSite: 'lax',
      });
      
      // Log successful logout
      await Logger.logInfo(
        'User logged out successfully',
        '/api/auth/logout',
        'POST',
        req.ipAddress,
        200
      );
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during logout';
      
      // Log logout error
      await Logger.logError(
        'Logout failed: ' + message,
        '/api/auth/logout',
        'POST',
        req.ipAddress,
        status,
        error
      );
      
      res.status(status).json({ message, error: error.message });
    }
  },
  signup: async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const result = await authService.signup(username, email, password, firstName, lastName);
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false, // Set to true only for HTTPS
        sameSite: 'lax',
        maxAge: 7*24 * 60 * 60 * 1000 // 7 days
      });

      const { refreshToken, ...responseData } = result;
      
      // Log successful signup
      await Logger.logInfo(
        'New user registered',
        '/api/auth/signup',
        'POST',
        req.ipAddress,
        201,
        { userId: responseData.createdUser.id, username, email }
      );
      
      res.status(201).json(responseData);
    } catch (error) {
      console.error('Signup error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during signup';
      
      // Log signup error
      await Logger.logError(
        'Signup failed: ' + message,
        '/api/auth/signup',
        'POST',
        req.ipAddress,
        status,
        error
      );
      
      res.status(status).json({ message, error: error.message });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { credential } = req.body;
      const result = await authService.googleLogin(credential);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { refreshToken, accessToken, foundUser } = result;

      await Logger.logInfo(
        'User logged in with Google successfully',
        '/api/auth/google',
        'POST',
        req.ipAddress,
        200,
        { userId: foundUser.id, email: foundUser.email }
      );

      res.status(200).json({
        encodedToken: accessToken,
        foundUser,
      });
    } catch (error) {
      console.error('Google login error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during Google login';

      await Logger.logError(
        'Google login failed: ' + message,
        '/api/auth/google',
        'POST',
        req.ipAddress,
        status,
        error
      );

      res.status(status).json({ message, error: error.message });
    }
  },

    login: async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: false, // Set to true only for HTTPS
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { refreshToken, accessToken, foundUser } = result;
        
        // Log successful login
        await Logger.logInfo(
          'User logged in successfully',
          '/api/auth/login',
          'POST',
          req.ipAddress,
          200,
          { userId: foundUser.id, email: foundUser.email }
        );

        res.status(200).json({
          encodedToken: accessToken,
           foundUser
        });
      } catch (error) {
        console.error('Login error:', error);
        const status = error.status || 500;
        const message = error.message || 'Server error during login';
        
        // Log login error
        await Logger.logError(
          'Login failed: ' + message,
          '/api/auth/login',
          'POST',
          req.ipAddress,
          status,
          error
        );
        
        res.status(status).json({ message, error: error.message });
      }
    },

  refreshTokenAPI: async (req, res) => {
    try {
   
      let refreshToken = req.cookies && req.cookies.refreshToken;
      if (!refreshToken && req.body && req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
      }
      if (!refreshToken) {
        console.error('No refresh token found in cookies or body');
        return res.status(400).json({ message: 'No refresh token provided in cookies or body' });
      }

      console.log('refreshToken value:', refreshToken);
      const result = await authService.refreshToken(refreshToken);
      // Set new refresh token as httpOnly cookie if present
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: false, // Set to true only for HTTPS
          sameSite: 'lax',
          maxAge: 3 * 60 * 1000 // 3 minutes
        });
      }
      // Remove refreshToken from response body
      const { refreshToken: newRefreshToken, ...responseData } = result;
      console.log('refreshToken result:', responseData);
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Refresh token error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during token refresh';
      res.status(status).json({ message, error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
},

resetPassword: async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}


};

module.exports = authController;
