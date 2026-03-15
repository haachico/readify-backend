const express = require('express');
const router = express.Router();
const {getUnreadCount, getNotifications, markNotificationsAsRead, markSingleNotificationAsRead} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/unread-count', authMiddleware, getUnreadCount);
router.get('/', authMiddleware, getNotifications);
router.post('/read', authMiddleware, markNotificationsAsRead);
router.post('/:id/read', authMiddleware, markSingleNotificationAsRead);   


module.exports = router;
