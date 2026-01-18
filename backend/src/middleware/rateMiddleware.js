const redisClient = require('../config/redis');

const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const minute = Math.floor(Date.now() / 60000);

        const key = `ratelimit:${userId}:${minute}`;

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
        next();
    }
};

module.exports = rateLimitMiddleware;