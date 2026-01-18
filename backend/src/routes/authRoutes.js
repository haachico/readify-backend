const express = require('express');

const router = express.Router();
const { signup, login, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateMiddleware');

router.post('/signup', rateLimitMiddleware, signup)
router.post('/login', rateLimitMiddleware, login)
router.post('/logout', authMiddleware, logout)


module.exports = router;
