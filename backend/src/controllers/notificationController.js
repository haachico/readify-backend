const notificationService = require('../services/notificationService');
const Logger = require('../utils/logger');


const { getNotificationsByUserId, getUnreadCountByUserId, markAllAsRead, markNotificationRead } = notificationService;

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const unreadCount = await getUnreadCountByUserId(userId);
    await Logger.logInfo(
      `User fetched unread notification count`,
      `/api/notifications/unread-count`,
      'GET',
      req.ipAddress,
      200,
      { userId, unreadCount }
    );
    res.json({ unreadCount });
  } catch (err) {
    const status = err.status || 500;
    await Logger.logError(
      `Failed to fetch unread notification count`,
      `/api/notifications/unread-count`,
      'GET',
      req.ipAddress,
      status,
      err
    );
    res.status(status).json({ message: 'Error fetching unread count', error: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId =req.auth.userId; 
    const notifications = await getNotificationsByUserId(userId);
    await Logger.logInfo(
      `User fetched notifications`,
      `/api/notifications`,
      'GET',
      req.ipAddress,
      200,
      { userId, notificationCount: notifications.length }
    );
    res.json({ notifications });
  } catch (err) {
    const status = err.status || 500;
    await Logger.logError(
      `Failed to fetch notifications`,
      `/api/notifications`,
      'GET',
      req.ipAddress,
      status,
      err
    );
    res.status(status).json({ message: 'Error fetching notifications', error: err.message });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await markAllAsRead(userId);
    await Logger.logInfo(
      `User marked all notifications as read`,
      `/api/notifications/mark-read`,
      'PUT',
      req.ipAddress,
      200,
      { userId }
    );
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    await Logger.logError(
      `Failed to mark notifications as read`,
      `/api/notifications/mark-read`,
      'PUT',
      req.ipAddress,
      status,
      err
    );
    res.status(status).json({ message: 'Error marking notifications as read', error: err.message });
  }
};


const markSingleNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await markNotificationRead(id);
        await Logger.logInfo(
          `User marked single notification as read`,
          `/api/notifications/:id/mark-read`,
          'PUT',
          req.ipAddress,
          200,
          { userId: req.auth.userId, notificationId: id }
        );
        res.json(result);
    }
    catch(err){
        await Logger.logError(
          `Failed to mark single notification as read`,
          `/api/notifications/:id/mark-read`,
          'PUT',
          req.ipAddress,
          500,
          err
        );
        res.status(500).json({ message: 'Error marking notification as read', error: err.message });  
    }
}

module.exports = {
  getUnreadCount,
  getNotifications,
  markNotificationsAsRead,
  markSingleNotificationAsRead
};
