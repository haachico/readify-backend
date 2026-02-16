const authService = require('../services/authService');

const authController = {
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      await authService.logout(refreshToken);
      // Clear the refreshToken cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false, // Set to true only for HTTPS
        sameSite: 'lax',
      });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during logout';
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
      res.status(201).json(responseData);
    } catch (error) {
      console.error('Signup error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during signup';
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
        res.status(200).json({
          encodedToken: accessToken,
           foundUser
        });
      } catch (error) {
        console.error('Login error:', error);
        const status = error.status || 500;
        const message = error.message || 'Server error during login';
        res.status(status).json({ message, error: error.message });
      }
    },

  refreshTokenAPI: async (req, res) => {
    try {
      console.log('=== REFRESH TOKEN CONTROLLER CALLED ===');
      console.log('req.cookies:', req.cookies);
      console.log('req.body:', req.body);
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

    logout: async (req, res) => {
      try {
        await authService.logout(req.user.id);
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
      } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
      }
    }
};

module.exports = authController;
