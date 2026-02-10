const express = require('express');

const router = express.Router();
const { signup, login, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { ipRateLimitMiddleware } = require('../middleware/rateMiddleware');
const { refreshToken } = require('../services/authService');

router.post('/signup', ipRateLimitMiddleware, signup)
router.post('/login', ipRateLimitMiddleware, login)
router.post('/logout', authMiddleware, logout)
router.post('/refresh-token', authMiddleware, refreshToken)


module.exports = router;
