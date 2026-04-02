const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const pool = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// startCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
