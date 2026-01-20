const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const authMiddleware = async (req, res, next) => {
    // Skip authentication for OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Extract token without 'Bearer ' prefix
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Check if token is blacklisted (user logged out)
        const isBlacklisted = await redisClient.get(`blacklist:${cleanToken}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token has been revoked. Please login again' });
        }

        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

        req.auth = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};


module.exports = authMiddleware;
