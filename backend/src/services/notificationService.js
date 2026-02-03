const pool = require('../config/db');

const notificationService = {

  async getNotificationsByUserId(userId, limit = 50) {
    const [rows] = await pool.query(
      `SELECT n.*, u.username AS sourceUsername, u.profileImage AS sourceProfileImage
       FROM notifications n
       LEFT JOIN users u ON n.sourceUserId = u.id
       WHERE n.userId = ?
       ORDER BY n.createdAt DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  async markNotificationRead (id){

    const [notifications] = await pool.query(
        `Select * FROM notifications WHERE id = ?`,
        [id]
    )

    if(notifications.length ===0){
        throw new Error ('Notification not found');
    }

    const [rows] = await pool.query(
    `UPDATE notifications SET isRead = 1 WHERE id = ?`,
    [id]
     )

    return { message: 'Notification marked as read' };
  } ,

  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET isRead = 1 WHERE userId = ?',
      [userId]
    );
    return { message: 'Notifications marked as read' };
  }
};

module.exports = notificationService;
