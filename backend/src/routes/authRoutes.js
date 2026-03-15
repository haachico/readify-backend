const express = require('express');

const router = express.Router();
const { signup, login, googleLogin, logout, refreshTokenAPI, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { ipRateLimitMiddleware } = require('../middleware/rateMiddleware');

router.post('/signup', ipRateLimitMiddleware, signup)
router.post('/login', ipRateLimitMiddleware, login)
router.post('/google', ipRateLimitMiddleware, googleLogin)
router.post('/logout', authMiddleware, logout)
router.post('/refresh-token', refreshTokenAPI)

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword    );


module.exports = router;
