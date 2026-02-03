const notificationService = require('../services/notificationService');


const { getNotificationsByUserId, markAllAsRead, markNotificationRead } = notificationService;
const getNotifications = async (req, res) => {
  try {
    const userId =req.auth.userId; 
    const notifications = await getNotificationsByUserId(userId);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await markAllAsRead(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error marking notifications as read', error: err.message });
  }
};


const markSingleNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await markNotificationRead(id);
        res.json(result);
    }
    catch(err){
        res.status(500).json({ message: 'Error marking notification as read', error: err.message });  
    }
}

module.exports = {
  getNotifications,
  markNotificationsAsRead,
  markSingleNotificationAsRead
};
