const pool = require('../config/db');

const Logger = {
  async log(logData) {
    try {
      const { level, message, route, method, ipAddress, statusCode, details } = logData;
      
      const query = `
        INSERT INTO logs (level, message, route, method, ipAddress, statusCode, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await pool.query(query, [
        level,
        message,
        route,
        method,
        ipAddress,
        statusCode,
        details ? JSON.stringify(details) : null
      ]);
    } catch (error) {
      console.error('Logger error:', error);
    }
  },

  async logError(message, route, method, ipAddress, statusCode, error) {
    try {
      await this.log({
        level: 'ERROR',
        message,
        route,
        method,
        ipAddress,
        statusCode,
        details: { errorMessage: error.message, stack: error.stack }
      });
    } catch (err) {
      console.error('LogError failed:', err);
    }
  },

  async logInfo(message, route, method, ipAddress, statusCode, details) {
    try {
      await this.log({
        level: 'INFO',
        message,
        route,
        method,
        ipAddress,
        statusCode,
        details
      });
    } catch (err) {
      console.error('LogInfo failed:', err);
    }
  }
};

module.exports = Logger;