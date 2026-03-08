const loggerMiddleware = (req, res, next) => {
  // Capture IP address
  req.ipAddress = req.ip || req.connection.remoteAddress;
  next();
};

module.exports = loggerMiddleware;