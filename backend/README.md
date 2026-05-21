# Readify Backend

Social media platform for book lovers built with **Node.js, Express, MySQL, and Redis**.

## 🚀 Quick Start

### Prerequisites

- Node.js v14+
- MySQL Server (Local XAMPP or Cloud Database)
- Redis Server
- ImageKit Account (for image uploads)

### Installation

```bash
# Navigate to backend directory
cd readify-backend/backend

# Install dependencies
npm install

# Create .env file with credentials
cp .env.example .env

# Start the server
npm start
```

Server runs on **http://localhost:5000**

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.js           # MySQL connection pool
│   │   ├── redis.js        # Redis client setup
│   │   └── imagekit.js     # ImageKit SDK initialization
│   │
│   ├── controllers/         # Business logic
│   │   ├── authController.js       # Auth endpoints
│   │   ├── postController.js       # Post endpoints
│   │   ├── commentController.js    # Comment endpoints
│   │   ├── userController.js       # User endpoints
│   │   └── notificationController.js
│   │
│   ├── services/           # Data access & business operations
│   │   ├── authService.js
│   │   ├── postService.js
│   │   ├── commentService.js
│   │   ├── userService.js
│   │   └── notificationService.js
│   │
│   ├── routes/             # API endpoints
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── userRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── imagekitMiddleware.js  # File upload to ImageKit
│   │   ├── rateMiddleware.js      # Rate limiting
│   │   ├── loggerMiddleware.js    # Request logging
│   │   └── uploadMiddleware.js    # Legacy (disk storage)
│   │
│   ├── utils/              # Utility functions
│   │   ├── emailService.js        # Nodemailer setup
│   │   └── logger.js              # Activity logging to DB
│   │
│   ├── db/                 # Database schemas (deprecated)
│   │   ├── users.js
│   │   └── posts.js
│   │
│   └── server.js           # Express app initialization
│
├── .env                    # Environment variables (git ignored)
├── .env.example            # Example env file
├── package.json            # Dependencies
└── README.md              # This file
```

---

## 🔧 Environment Variables (.env)

```env
# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=readify

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Server
PORT=5000
NODE_ENV=development

# Email Service (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# ImageKit (for image uploads)
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/signup              # Register new user
POST   /api/auth/login               # Login with email & password
POST   /api/auth/google              # OAuth login
POST   /api/auth/logout              # Logout (blacklist token)
POST   /api/auth/refresh-token       # Get new access token
POST   /api/auth/forgot-password     # Send password reset email
POST   /api/auth/reset-password      # Reset password with token
```

### Posts

```
GET    /api/posts                    # Get all posts
GET    /api/posts/feed               # Get personalized feed (auth)
POST   /api/posts                    # Create post with image (auth)
GET    /api/posts/trending           # Get trending posts
GET    /api/posts/:postId            # Get post details
GET    /api/posts/user/:userId       # Get user's posts (auth)
POST   /api/posts/edit/:postId       # Edit post (auth)
DELETE /api/posts/:postId            # Delete post (auth)

# Likes
POST   /api/posts/like/:postId       # Like/Unlike post (auth)

# Bookmarks
GET    /api/posts/bookmarks          # Get bookmarked posts (auth)
POST   /api/posts/bookmarks/:postId  # Bookmark post (auth)
POST   /api/posts/remove-bookmark/:postId  # Remove bookmark (auth)
```

### Comments

```
POST   /api/comments/posts/:postId/comments          # Add comment (auth)
GET    /api/comments/posts/:postId/comments          # Get comments (auth)
DELETE /api/comments/posts/:postId/comments/:commentId  # Delete comment (auth)
POST   /api/comments/:commentId/replies              # Add reply to comment (auth)
```

### Notifications

```
GET    /api/notifications                      # Get all notifications (auth)
GET    /api/notifications/unread-count         # Get unread count (auth)
POST   /api/notifications/read                 # Mark all as read (auth)
POST   /api/notifications/:id/read             # Mark single as read (auth)
```

### Users

```
GET    /api/users                    # Get all users
GET    /api/users/:username          # Get user by username
GET    /api/users/search             # Search users by username
POST   /api/users/follow             # Follow/Unfollow user (auth)
POST   /api/users/updateProfile      # Update user profile (auth)
GET    /api/users/getFollowers/:userId       # Get followers list (auth)
GET    /api/users/getFollowing/:userId       # Get following list (auth)
```

### Cover Letter (Admin Only)

```
POST   /api/cover-letter/send        # Send cover letter to company (admin auth)
```

**Request Body:**

```json
{
  "recipientEmail": "hiring@company.com",
  "companyName": "Acme Corp",
  "positionName": "Senior Developer"
}
```

**Features:**

- Sends templated cover letter
- Attaches resume PDF
- Logs application to Google Sheets
- Queued for async delivery
- Only accessible to admin user

### AI Features

```
POST   /api/ai/improve-post          # Improve post text using Gemini AI (auth)
POST   /api/ai/validate-post         # Validate if post is book-related (auth)
```

---

## 🗄️ Database Schema

### Tables

- **users** - User accounts & profiles
- **posts** - User posts with images
- **comments** - Post comments & nested replies
- **likes** - Post likes
- **bookmarks** - Saved posts
- **follows** - User relationships
- **notifications** - User notifications
- **logs** - API activity logs

---

## 🔐 Authentication Flow (Dual-Token Pattern)

```
1. User Signs Up/Logs In
   └─ Password hashed with bcrypt (salt rounds: 10)
   └─ JWT accessToken (15 min) generated → stored in localStorage (frontend)
   └─ JWT refreshToken (7 days) generated → stored in httpOnly cookie
   └─ refreshToken persisted in DB for revocation tracking

2. Protected Routes Check JWT
   └─ authMiddleware extracts token from Authorization header
   └─ Verifies JWT signature using JWT_SECRET
   └─ Checks if token revoked in DB (instant logout)
   └─ req.auth = decoded token payload { userId, username }

3. Token Refresh (Automatic)
   └─ Frontend detects 401 response (token expired)
   └─ Automatically calls POST /api/auth/refresh-token
   └─ Sends old refreshToken from httpOnly cookie
   └─ Backend validates & returns new accessToken (15 min)
   └─ Frontend retries original request (~150ms, seamless UX)

4. Logout (Instant Revocation)
   └─ POST /api/auth/logout removes token from DB
   └─ Token added to Redis blacklist (7 days)
   └─ Token immediately invalid (can't be refreshed)

**Why Dual-Token?**
- Short-lived access token: Limits damage if compromised
- Refresh token in httpOnly cookie: Can't be stolen by JavaScript
- Stateless API: Enables horizontal scaling
- Instant logout: Database check prevents replay attacks
```

---

## 📤 Image Upload Flow (ImageKit)

```
1. Frontend uploads image with post
2. Backend receives multipart/form-data
3. Multer reads file into memory (not disk)
4. uploadToImageKit middleware:
   - Takes file buffer
   - Uploads to ImageKit cloud
   - Gets permanent URL back
5. URL stored in DB
6. Server can restart - images persist ✅
```

---

## 🔔 Notification System (Polling-Based)

### Notification Triggers

Notifications are automatically created for:

- **Like**: When someone likes your post
- **Comment**: When someone comments on your post
- **Reply**: When someone replies to your comment
- **Bookmark**: When someone bookmarks your post
- **Follow**: When someone follows you

### Notification Features

- ✅ **Real-time Polling**: Frontend polls every 30 seconds for new notifications
- ✅ Unread count tracking
- ✅ Mark single notification as read
- ✅ Mark all notifications as read
- ✅ Retrieve full notification history
- ✅ Store in MySQL (persistent, survives server restart)
- ✅ Automatic cleanup of old notifications

### Implementation Details

**Polling Flow:**

```
Frontend (every 30s)
  ↓
GET /api/notifications (with JWT auth)
  ↓
Backend checks database for unread
  ↓
Returns: { unreadCount, notifications: [...] }
  ↓
Frontend updates UI
```

**Why Polling Instead of WebSocket?**

- Simpler architecture (no persistent connections)
- Works with Render & shared hosting
- Acceptable for moderate traffic
- Easy to scale horizontally
- Fallback if connection drops

### Future Enhancements

- WebSocket support (real-time, zero delay)
- Email notifications on new engagement
- Notification preferences (on/off per event type)

---

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent brute force & spam
- **Token Blacklisting** - Redis-backed logout
- **CORS** - Cross-origin request handling
- **Input Validation** - Request data validation
- **Email Verification** - For password reset
- **Error Logging** - Track all errors & activities

---

## 🤖 AI Features (Google Gemini)

### Post Validation (Hard Gate) ⭐

```
POST /api/ai/validate-post
Body: { "text": "user's post content" }
Response: { "isBookRelated": true/false }
```

**What it does:**

- Validates if post is about books/reading/authors/literature
- Returns YES/NO based on Gemini 2.5 Flash model
- If YES → User can post (with or without image)
- If NO → Post is blocked (neither text nor image is saved)

**Why It Matters:**

- Keeps community focused on books & reading
- Prevents spam/off-topic content
- Enforced before image upload (efficient)
- Mandatory gate (cannot be bypassed by users)

**Frontend Flow:**

```
1. User enters post content + optional image
2. Clicks "Post" button
3. Frontend calls POST /api/ai/validate-post
4. If isBookRelated = false → Show alert, BLOCK post ✗
5. If isBookRelated = true → Upload image (if any), Create post ✅
```

### Post Improvement (Optional Enhancement)

```
POST /api/ai/improve-post
Body: { "text": "user's post content" }
Response: { "improvedText": "enhanced post text" }
```

**What it does:**

- Takes user's post text
- Uses Gemini to make it more engaging & compelling
- Preserves original meaning & intent
- Returns improved version

**Frontend Flow:**

```
1. User writes post
2. Clicks "Improve" (optional button)
3. Frontend calls POST /api/ai/improve-post
4. Gemini returns enhanced text
5. Improved version shown to user in editor
6. User can accept, edit further, or keep original
```

### Configuration

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Get API key from: [Google AI Studio](https://aistudio.google.com/)

**Note:** Both endpoints require authentication (auth token)

---

## 📊 Middleware Stack

### Request Flow

```
Request
  ↓
├─ authMiddleware        [Check JWT token]
├─ rateLimitMiddleware   [Rate limiting]
├─ upload.single()       [Parse multipart file]
├─ uploadToImageKit      [Upload to cloud]
├─ loggerMiddleware      [Log request]
│
└─ Controller → Service → Database
```

---

## � Async Email Queue (Bull + Redis)

### Overview

Password reset and cover letter emails are sent asynchronously using **Bull queue** to:

- Prevent blocking the main request
- Ensure emails are retried if sending fails
- Persist jobs in Redis (survive server restart)
- Track email delivery status

### Email Types

1. **Password Reset Email**
   - Triggered by `POST /api/auth/forgot-password`
   - Sends reset link (valid for 1 hour)
   - Retries automatically

2. **Cover Letter Email**
   - Triggered by `POST /api/cover-letter/send`
   - Attaches resume PDF
   - Logs to Google Sheets
   - Retries automatically

### Retry Logic

```
Job Processing Flow:
  ↓
1st Attempt (fails)
  ↓ Wait 2 seconds
2nd Attempt (fails)
  ↓ Wait 4 seconds
3rd Attempt (fails)
  ↓ Wait 8 seconds
4th Attempt (fails)
  ↓
Job discarded, logged as ERROR

**Result:** Max 3 retries over ~14 seconds
```

**Configuration:**

```env
REDIS_URL=redis://localhost:6379
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Monitoring Jobs:**

```javascript
// Check queue status
const queueStatus = await emailQueue.count();
console.log(`Pending emails: ${queueStatus}`);

// Process jobs
emailQueue.process(async (job) => {
  console.log(`Processing email: ${job.id}`);
  // Job data in job.data
});
```

---

## ⏰ Scheduled Tasks (Cron Jobs)

### Background Jobs

The backend runs scheduled tasks using **node-cron** (runs on server, not in queue):

### Expired Token Cleanup

**Schedule:** Every hour at minute 0 (e.g., 10:00, 11:00, 12:00)

**What it does:**

1. Queries database for expired password reset tokens
2. Counts tokens with `reset_token_expiry < NOW()`
3. Deletes expired tokens from users table
4. Logs activity to database (level: INFO)
5. Sends email report to admin

**Example Log:**

```json
{
  "timestamp": "2026-05-21T14:00:00Z",
  "job": "Expired Token Cleanup",
  "status": "SUCCESS",
  "tokensExpired": 5,
  "tokensDeleted": 5
}
```

**Why This Matters:**

- Prevents accumulation of stale reset tokens
- Keeps database clean
- Audit trail for compliance
- Early warning if too many failures

---

## �🚨 Error Handling

All errors follow this format:

```javascript
{
  message: "User-friendly message",
  error: "Error details"
}
```

Status codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `422` - Unprocessable Entity (conflict - email exists)
- `429` - Too Many Requests (rate limited)
- `500` - Server Error

---

## 📝 Logging

### Activity Logs (MySQL)

All API activities logged to `logs` table:

- Level: INFO, ERROR, WARNING
- Route, Method, IP Address
- Status Code, Response Details
- Timestamp

Query logs:

```sql
SELECT * FROM logs WHERE level = 'ERROR' ORDER BY createdAt DESC;
```

---

## 🔄 Data Flow Examples

### Create Post with Image

```
POST /api/posts
Headers: Authorization: Bearer <token>
Body: FormData {
  image: <file>,
  content: "I love this book!"
}

Flow:
1. authMiddleware validates JWT ✅
2. Multer reads image to buffer ✅
3. uploadToImageKit uploads to cloud ✅
4. createPost saves URL to DB ✅
5. Response includes post data + imageUrl ✅
```

### Like/Unlike Post

```
POST /api/posts/like/:postId
Headers: Authorization: Bearer <token>

Flow:
1. Check if user already liked
2. If liked → delete like record
3. If not liked → insert like record
4. Update post likeCount
5. Create notification (if not own post)
6. Response: { liked: true/false, likeCount: N }
```

---

## 🧪 Testing

### Manual Testing with Curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get feed
curl -X GET http://localhost:5000/api/posts/feed \
  -H "Authorization: Bearer <accessToken>"

# Create post with image
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <accessToken>" \
  -F "content=My favorite book!" \
  -F "image=@path/to/image.jpg"
```

---

## 🚀 Deployment (Render)

### Deployment Steps

1. **Connect GitHub Repository**
   - Push code to GitHub
   - Connect Render to repo

2. **Set Environment Variables**
   - Add all .env variables in Render dashboard
   - Include database credentials

3. **Database Setup**
   - Create MySQL database on Aiven/AWS RDS
   - Import schema/dump file
   - Update MYSQL_HOST in .env

4. **Redis Setup**
   - Create Redis instance on Redis Cloud (free tier available)
   - Update REDIS_URL in .env
   - Used for: token blacklist, email queue, rate limiting

5. **Deploy**
   - Render auto-deploys on git push
   - Monitor logs in Render dashboard
   - Check cron jobs are running (check logs)

### ⚠️ Render Free Tier: Cold Start Delay

**Important:** Render's free tier spins down after 15 minutes of inactivity.

**What You'll Experience:**

- First request after inactivity = **30-50 second delay** ⏳
- Backend server is "waking up" from sleep
- Subsequent requests are instant ⚡
- **This does NOT affect paid hosting** (standard/pro plans have no spin-down)

**Mitigation Options:**

1. Upgrade to paid Render plan (no cold start)
2. Use external uptime monitor to ping every 15 min
3. Warn users about initial load time
4. Inform interviewer about this limitation

### Important Notes

- ⚠️ Never commit .env file
- ⚠️ Images stored in ImageKit (not local disk)
- ⚠️ Use cloud database (not local XAMPP)
- ⚠️ Redis instance needed (Render or Redis Cloud)
- ⚠️ Cron jobs only run on one instance (no horizontal scaling of cron)
- ⚠️ Monitor email queue depth (if emails pile up, investigate)

---

## 📚 Technology Stack

- **Runtime**: Node.js v14+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Cache & Queue**: Redis
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Email**: Nodemailer (SMTP)
- **Email Queue**: Bull (job queue)
- **Scheduled Tasks**: node-cron
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **File Upload**: multer + ImageKit CDN
- **Logging**: Custom logger to DB
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware
- **Google Sheets**: googleapis (for cover letter logging)

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes & test
3. Commit: `git commit -m "feat: add feature"`
4. Push: `git push origin feature/feature-name`
5. Create Pull Request

---

## � Quick Reference: What's Implemented

✅ **Core Features**

- User authentication (signup, login, OAuth, password reset)
- Posts with AI validation & image uploads
- Comments & nested replies
- Like/Unlike & Bookmark features
- Follow/Unfollow system
- Real-time notifications (30s polling)

✅ **Advanced Features**

- **AI-Powered Post Validation** (Gemini) - blocks non-book posts
- **Async Email Queue** (Bull) - 3 retries with backoff
- **Cron Jobs** - hourly token cleanup
- **Cover Letter Generator** - sends to companies with resume
- **Google Sheets Logging** - tracks applications
- **JWT Dual-Token** - access + refresh pattern
- **Rate Limiting** - prevents abuse
- **Request Logging** - all activities logged to DB

✅ **Infrastructure**

- ImageKit CDN - image storage & optimization
- Redis - caching, queues, rate limiting, token blacklist
- MySQL - relational database
- Render - deployment (free tier with cold start)

---

## �📄 License

This project is private. All rights reserved.

---

## 👥 Team

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: MySQL + Redis

Last Updated: May 21, 2026
