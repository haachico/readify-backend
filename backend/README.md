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

## 🔐 Authentication Flow

```
1. User Signs Up/Logs In
   └─ Password hashed with bcrypt
   └─ JWT accessToken (15 min) + refreshToken (7 days) generated
   └─ refreshToken stored in DB

2. Protected Routes Check JWT
   └─ authMiddleware verifies token
   └─ Token blacklist checked (Redis)
   └─ req.auth = decoded token payload

3. Token Refresh
   └─ Old token expires → POST /refresh-token
   └─ New accessToken issued

4. Logout
   └─ Token added to blacklist (Redis)
   └─ Token invalidated for 7 days
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

## 🔔 Notification System

### Notification Triggers

Notifications are automatically created for:

- **Like**: When someone likes your post
- **Comment**: When someone comments on your post
- **Reply**: When someone replies to your comment
- **Bookmark**: When someone bookmarks your post

### Notification Features

- ✅ Unread count tracking
- ✅ Mark single notification as read
- ✅ Mark all notifications as read
- ✅ Retrieve notification history
- ✅ Store in MySQL (persistent)

### Real-time Features (Future)

- WebSocket support (can be added)
- Email notifications (can be added)

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

### Post Improvement

```
POST /api/ai/improve-post
Body: { "text": "user's post content" }
Response: { "improvedText": "enhanced post text" }
```

- Uses Gemini 2.5 Flash model
- Makes posts more engaging & compelling
- Preserves original meaning
- Returns improved text for display

### Post Validation

```
POST /api/ai/validate-post
Body: { "text": "user's post content" }
Response: { "isBookRelated": true/false }
```

- Validates if post is book-related
- Returns YES/NO based on Gemini analysis
- Prevents non-book content from being posted
- Keeps community focused on books & reading

### How It Works

1. **Improvement Flow**
   - User writes post
   - Frontend calls `/api/ai/improve-post`
   - Gemini enhances the text
   - Improved version shown to user
   - User can accept or edit further

2. **Validation Flow**
   - User submits post
   - Frontend calls `/api/ai/validate-post`
   - Gemini checks if book-related
   - If YES → Post allowed
   - If NO → Error message, post rejected

### Configuration

```env
AI_API_KEY=your_google_gemini_api_key
```

Get from: [Google AI Studio](https://aistudio.google.com/)

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

## 🚨 Error Handling

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

4. **Deploy**
   - Render auto-deploys on git push
   - Monitor logs in Render dashboard

### Important Notes

- ⚠️ Never commit .env file
- ⚠️ Images stored in ImageKit (not local disk)
- ⚠️ Use cloud database (not local XAMPP)
- ⚠️ Redis instance needed (Render or Redis Cloud)

---

## 📚 Technology Stack

- **Runtime**: Node.js v14+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Cache**: Redis
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Email**: Nodemailer
- **File Upload**: multer + ImageKit
- **Logging**: Custom logger to DB
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes & test
3. Commit: `git commit -m "feat: add feature"`
4. Push: `git push origin feature/feature-name`
5. Create Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

## 👥 Team

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: MySQL + Redis

Last Updated: March 2026
