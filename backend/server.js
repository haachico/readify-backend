const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const REQUIRED_ENVS = [
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'FRONTEND_URL',
  'BACKEND_URL',
  'GOOGLE_CLIENT_ID',
  'AI_API_KEY',
  'ADMIN_USER_ID',
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT'
];


const hasMySQLDb = process.env.MYSQL_DATABASE || process.env.MYSQL_NAME;

const missingEnvs = REQUIRED_ENVS.filter(env => !process.env[env]);

if (!hasMySQLDb) {
  missingEnvs.push('MYSQL_DATABASE or MYSQL_NAME');
}

if (missingEnvs.length > 0) {
  console.error(' Missing required environment variables:');
  missingEnvs.forEach(env => console.error(`   - ${env}`));
  process.exit(1);
}

console.log('✅ All required environment variables present');
// Middleware
const cookieParser = require("cookie-parser");
const allowedOrigins = [
  "http://localhost:3000",
  "https://readify-lilac.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());

app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    return next();
  }
  express.json({ limit: "50mb" })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ limit: "50mb", extended: true })(req, res, next);
  });
});

const loggerMiddleware = require("./src/middleware/loggerMiddleware");

app.use(loggerMiddleware);

const {
  authRoutes,
  postRoutes,
  commentRoutes,
  userRoutes,
  notificationRoutes,
  aiRoutes,
  coverLetterRoutes,
} = require("./src/routes");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", coverLetterRoutes);

const { startCronJobs } = require("./src/config/cron");

// 404 Handler - must be BEFORE error handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  console.error(`   Method: ${req.method} ${req.originalUrl}`);
  console.error(`   Status: ${statusCode}`);
  if (isDevelopment) console.error(`   Stack: ${err.stack}`);

  // Safe to show: Client errors (4xx) - validation, auth, not found
  // Unsafe to show: Server errors (5xx) - database, internal errors
  const isSafeError = statusCode < 500;
  const message = (isDevelopment || isSafeError) 
    ? err.message 
    : 'Internal Server Error';
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    ...(isDevelopment && { stack: err.stack })
  });
});

// startCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
