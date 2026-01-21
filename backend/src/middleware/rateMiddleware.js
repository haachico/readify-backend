const redisClient = require('../config/redis');

// Rate limit by user ID (for authenticated endpoints)
const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Skip rate limiting if Redis is not available
        if (typeof redisClient.isConnected === 'function' && !redisClient.isConnected()) {
            return next();
        }

        const minute = Math.floor(Date.now() / 60000);
        const key = `ratelimit:user:${userId}:${minute}`;

        const count = await redisClient.incr(key);

        if (count === 1) {
            await redisClient.expire(key, 60);
        }

        if (count > 100) {
            return res.status(429).json({
                message: 'Too many requests. Try again later.'
            });
        }

        next();
    } catch (err) {
        console.error('Rate limiter error:', err);
        next(); // Continue even if Redis fails
    }
};

// Rate limit by IP address (for public endpoints like signup, login)
const ipRateLimitMiddleware = async (req, res, next) => {
    try {
        // Skip rate limiting if Redis is not available
        if (typeof redisClient.isConnected === 'function' && !redisClient.isConnected()) {
            return next();
        }

        // Get IP address from request
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const minute = Math.floor(Date.now() / 60000);
        const key = `ratelimit:ip:${ip}:${minute}`;

        const count = await redisClient.incr(key);

        if (count === 1) {
            await redisClient.expire(key, 60);
        }

        // Higher limit for IP-based (prevent brute force login attempts)
        if (count > 50) {
            return res.status(429).json({
                message: 'Too many requests from this IP. Try again later.'
            });
        }

        next();
    } catch (err) {
        console.error('IP Rate limiter error:', err);
        next(); // Continue even if Redis fails
    }
};

module.exports = { rateLimitMiddleware, ipRateLimitMiddleware };