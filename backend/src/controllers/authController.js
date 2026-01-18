const authService = require('../services/authService');

const authController = {
  signup: async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const result = await authService.signup(username, email, password, firstName, lastName);
      res.status(201).json(result);
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
      res.status(200).json(result);
    } catch (error) {
      console.error('Login error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during login';
      res.status(status).json({ message, error: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(400).json({ message: 'No token provided' });
      }
      const result = await authService.logout(token);
      res.status(200).json(result);
    } catch (error) {
      console.error('Logout error:', error);
      const status = error.status || 500;
      const message = error.message || 'Server error during logout';
      res.status(status).json({ message, error: error.message });
    }
  }
};

module.exports = authController;
