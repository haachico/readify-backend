# Navgurukul Pre-Work Submission: Readify Project

**Candidate:** Nilesh Kokare  
**Role:** Full Stack Developer  
**Submission Date:** May 21, 2026  
**Project:** Readify - Social Media Platform with AI Integration

---

## Section 1: Context (Brief)

### One-Paragraph Description

Readify is a full-stack social media platform designed for book readers to share recommendations, discover new reads, build reading communities, and connect with other book enthusiasts. Built with React.js frontend, Node.js/Express backend, and MySQL database, the platform follows a **layered MVC architecture** with organized routes, controllers, and services for maintainability. Core features include user authentication with JWT tokens, polling-based real-time notifications, image optimization via ImageKit for book covers and user profiles, and a follow/network system. The backend uses async email queues (Bull + Redis) for reliable email delivery and implements RESTful API design principles. Additionally, I integrated Google Gemini AI for cover letter generation as a personal side feature during development.

### Primary Technical Constraints

1. **Token Management at Scale:** Managing access token expiration (15 min), refresh token rotation (7 days), and maintaining session state without server-side sessions
2. **Image Optimization:** Handling book cover image uploads efficiently while controlling storage costs (solved with ImageKit CDN)
3. **Email Reliability:** Ensuring password reset and application emails reach users even if sending fails initially (solved with Bull queue + 3 retries)
4. **Real-time Notifications:** Implemented polling-based notifications (currently polling every 30s) to keep users updated on new posts/follows without WebSocket complexity
5. **Data Privacy:** Protecting user emails and sensitive information in API responses
6. **Response Format Consistency:** Currently responses vary across endpoints - standardizing to uniform structure is a priority improvement

---

## Key Technical Highlights

- **JWT Authentication** - Dual-token pattern with refresh rotation (15 min access + 7 day refresh)
- **Async Email Processing** - Bull queue with 3 retries + exponential backoff (2s → 4s → 8s)
- **AI-Powered Validation** - Google Gemini enforces book-related content before posting
- **Real-time Notifications** - Polling-based system (30s intervals) with unread tracking
- **Image Optimization** - ImageKit CDN for book covers & profiles (cloud storage)
- **Layered MVC Architecture** - Clean separation: controllers → services → database
- **Stateless API Design** - No server sessions, enables horizontal scaling
- **Production Deployment** - Render + Redis + MySQL with monitoring

---

## Section 2: Technical Implementation (Detailed)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React.js)                       │
│  - State Management: Context API                                │
│  - Authentication: JWT stored in localStorage + httpOnly cookie  │
│  - UI Components: Posts, Comments, User profiles                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  API Gateway (Express.js)                        │
│  - CORS handling                                                │
│  - Rate limiting                                                │
│  - Request logging                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Auth Middleware  │ │ Other Middleware │ │ CSRF Protection  │
│ (JWT validation) │ │ (logging, cors)  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Route Handlers & Controllers                    │
│  - authController      - postController      - userController   │
│  - commentController   - notificationController                 │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Services Layer                                │
│  - authService        - postService        - userService        │
│  - commentService     - notificationService                     │
│  (Business Logic, Validation, Orchestration)                    │
└──────────────────────────┬──────────────────────────────────────┘
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  MySQL Database  │ │  Email Queue     │ │  ImageKit CDN    │
│  (Posts, Users,  │ │  (Bull + Redis)  │ │  (Image Storage) │
│   Comments, etc) │ │  (Async Emails)  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Architecture Explanation:** The frontend communicates with the Express API layer via HTTP requests. The API middleware validates JWT tokens before reaching controllers. Controllers delegate business logic to services, which interact with databases and external services. This separation ensures scalability, testability, and maintainability. The email queue decouples email sending from the request-response cycle, improving performance and reliability.

---

### Code Walk-through: Critical Function

**Function:** `refreshToken()` from [src/services/authService.js](src/services/authService.js#L176-L208)

**Why it's critical:** This function handles token expiration gracefully, allowing users to maintain long sessions securely without re-authentication.

```javascript
async refreshToken(oldRefreshToken) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Step 1: Verify token signature using JWT_REFRESH_SECRET
    let payload;
    try {
      payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    // Step 2: Query database - ensure token hasn't been revoked (user didn't logout)
    const [users] = await connection.query(
      'SELECT id FROM users WHERE id = ? AND refresh_token = ?',
      [payload.userId, oldRefreshToken]
    );

    if (users.length === 0) {
      throw { status: 401, message: 'Refresh token not found' };
    }

    // Step 3: Generate new access token (15 min expiry for security)
    const newAccessToken = jwt.sign(
      { userId: payload.userId, username: payload.username },
      process.env.JWT_SECRET,
      { expiresIn: '15min' }
    );

    // Step 4: Return new token to frontend
    return { accessToken: newAccessToken };
  } finally {
    if (connection) connection.release();
  }
}
```

**Step-by-Step Explanation:**

1. **JWT Verification:** Validates token signature hasn't been tampered with. If expired or invalid, rejects immediately
2. **Database Check:** Double-checks token in database to prevent replay attacks. If user logged out, token is NULL in DB
3. **New Token Generation:** Issues fresh access token with 15-min expiry for security
4. **Resource Cleanup:** Releases database connection (prevents connection leaks)

**Why this approach is secure:**

- Token signature validated before DB query (fail-fast)
- Database stores token to enable instant logout
- Short access token lifespan limits damage if compromised
- Refresh token stays in httpOnly cookie (inaccessible to JavaScript)

---

### Frontend Integration: Automatic Token Refresh

**Pattern:** When a request fails with 401, frontend automatically calls `/api/auth/refresh-token` (sending httpOnly refresh token), gets new access token, retries original request. All in ~150ms, seamless to user.

**Implementation:**

```javascript
// API interceptor in React context
if (response.status === 401) {
  const { accessToken } = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include", // httpOnly cookie sent automatically
  }).then((r) => r.json());

  localStorage.setItem("accessToken", accessToken);
  return fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
```

---

### Data Flow: Post Creation with AI Validation

**High-level flow:**

1. User enters content → Frontend validates
2. **AI Gate:** POST /api/ai/validate-post → Gemini says book-related? If NO, block ✗ | If YES, proceed ✅
3. **Image Upload:** POST /api/upload → ImageKit returns URL (or skip if no image)
4. **Auth Check:** authMiddleware validates JWT signature
5. **Create Post:** Controller → Service validates & inserts → Database saves
6. **Response:** Return formatted post (no email, clean field names)
7. **Frontend:** Update local state, post appears in feed

**Why this matters:** AI validation enforces community focus (only book content). Layered architecture keeps concerns separate. Token refresh is automatic (user never re-logs in mid-session).

---

## Section 3: Technical Decisions (Core)

### Decision 1: JWT with Access + Refresh Token Pattern (vs Server Sessions)

**Decision Made:** Implemented dual-token system with:

- **Access Token:** 15-minute expiry (stored in state/localStorage)
- **Refresh Token:** 7-day expiry (stored in httpOnly cookie)

**Alternatives Considered:**

1. **Simple Long-Lived JWT (one token)**
   - Pro: Simpler implementation, fewer database queries
   - Con: Token compromise = long security window, can't revoke instantly

2. **Server-Side Sessions (e.g., Express-session)**
   - Pro: Can revoke instantly, more control
   - Con: Doesn't scale horizontally, requires session store, not mobile-friendly

3. **OAuth2 Authorization Code Flow**
   - Pro: Industry standard, delegated auth
   - Con: Overkill for own app, adds complexity

**Trade-offs:**

| Aspect      | Gained                          | Lost                       |
| ----------- | ------------------------------- | -------------------------- |
| Security    | Short-lived tokens limit damage | Need Redis blacklist       |
| Scalability | Stateless (horizontal scaling)  | More complex than 1-token  |
| UX          | No re-login on refresh          | ~150ms delay on expiry     |
| Logout      | Instant revocation (DB check)   | Extra DB query per request |

**Outcome in Practice:**

- ✅ Users stayed logged in across page refreshes
- ✅ API remained stateless (deployed multiple instances)
- ✅ Security was solid (short-lived tokens)
- ⚠️ Discovered: Mobile apps needed fallback to body refresh tokens
- 📝 **Improvement:** Could add Redis token blacklist for instant revocation

---

### Decision 2: Async Email Queue (Bull) vs Synchronous Sending

**Decision Made:** Implemented Bull queue for async email with:

- **Retry Logic:** 3 automatic retries with exponential backoff (2s → 4s → 8s)
- **Separation:** Email processing decoupled from API request

**Alternatives Considered:**

1. **Synchronous Email in Controller**
   - Pro: Simple, email status returned immediately
   - Con: Slow (3-5s per email), blocks request, timeouts, poor UX

2. **Third-Party Service (Twilio SendGrid)**
   - Pro: Scalable, reliable, handles retries
   - Con: Costs money, adds dependency, less control

3. **Simple Worker (setTimeout)**
   - Pro: No external dependencies
   - Con: Not persistent, lost on crash, no retry logic

**Trade-offs:**

| Aspect      | Gained                        | Lost                          |
| ----------- | ----------------------------- | ----------------------------- |
| Performance | Non-blocking (instant UI)     | Email arrives ~5-10s later    |
| Reliability | 3 automatic retries + backoff | Queue complexity & monitoring |
| Cost        | Uses existing Redis           | Redis must run 24/7           |

**Outcome in Practice:**

- ✅ Password reset completed in <100ms (no waiting)
- ✅ Failed emails auto-retried, few lost
- ✅ Google Sheets logging worked reliably
- ⚠️ Discovered: Queue depth grew when email service down
- 📝 **Improvement:** Add queue monitoring + alerts for queue health

---

## Section 4: Learning & Iteration (Concise)

### Technical Mistake & Learning

**Mistake:** Returned user `email` field in post API responses

```javascript
// ❌ BEFORE (Privacy Issue)
GET /api/posts/:id
Response:
{
  post: {
    id: 1,
    content: "Hello world",
    email: "user@example.com",  // EXPOSED!
    username: "john",
    firstName: "John"
  }
}
```

**What Happened:**

- User emails were exposed publicly in API
- Any frontend user could scrape all emails
- Security review caught it immediately
- Could lead to spam, data misuse

**What I Learned:**

- **Principle:** Treat PII (email, phone, address) as sensitive
- **Practice:** Only expose minimal user info unless necessary
- **Rule:** Never expose email unless explicitly authenticated

**Solution Applied:**

```javascript
// ✅ AFTER (Secure)
const formatUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  profileImage: user.profileImage,
  // ❌ email removed
  // ❌ password hash removed
  // ❌ reset_token removed
});
```

---

### One Thing I'd Do Differently Today

**Topic:** API Versioning from Day 1

**Current State:**

```
/api/posts
/api/users
/api/auth/login
```

**Better State:**

```
/api/v1/posts
/api/v1/users
/api/v1/auth/login
```

**Why This Matters:**

1. **Breaking Changes:** Can safely introduce v2 without breaking v1 clients
2. **Client Communication:** Clear what version client is using
3. **Gradual Migration:** Can deprecate v1, migrate users to v2
4. **Production Readiness:** Shows scalability thinking

**Implementation:**

```javascript
// In routes/index.js
const v1Router = require("./v1/index");
app.use("/api/v1", v1Router);

// Future: Easy to add v2
const v2Router = require("./v2/index");
app.use("/api/v2", v2Router);
```

**Why I didn't do it initially:**

- Seemed like over-engineering for MVP
- No pressure to change API contract

**Learning:** Production-grade systems need versioning from start. Hard to retrofit later.

---

### Third Learning: Response Format Standardization & HTTP Methods

**Issues Identified:**

1. **Inconsistent Response Formats:**
   - Some endpoints return `{ message, data }`
   - Others return `{ success, message, post }`
   - Some missing status codes, timestamps, metadata

2. **Wrong HTTP Methods:**
   - Using `PUT` for partial updates (should use `PATCH`)
   - Example: `PUT /api/posts/:id` replaces entire post instead of partial update

**Current Problem:**

```javascript
// ❌ Inconsistent across endpoints
POST /api/posts → { success: true, post: {...} }
GET /api/posts → { message: "Success", posts: [...] }
PUT /api/posts/:id → { post: {...} }
DELETE /api/posts/:id → { message: "Deleted" }
```

**Ideal Standard (from API Design Principles):**

```json
{
  "success": true,
  "message": "Post created successfully",
  "statusCode": 201,
  "data": {
    "post": {
      "id": 1,
      "content": "...",
      "author": {...},
      "createdAt": "2026-05-21T10:30:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-05-21T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**What I'm Doing About It:**

- Phase 1 (May 25): Create response formatter utility
- Phase 2 (May 28): Apply to all auth endpoints
- Phase 3 (June 4): Apply to posts, comments, users
- Phase 4: Update frontend to handle consistent format
- Bonus: Change PUT to PATCH where appropriate

**Why This Matters:**

- Frontend knows exactly what to expect
- Error handling becomes consistent
- Request tracking easier with request IDs
- API documentation becomes simpler
- Clients don't need special logic per endpoint

**Learning:** Standard response formats seem simple but save hours in debugging. Should establish patterns before building, not after.

---

## Appendix: Supporting Links & Deployment Notes

### Repositories

- **Frontend Repository:** [github.com/haachico/Readify](https://github.com/haachico/Readify) (React.js)
- **Backend Repository:** [github.com/haachico/readify-backend](https://github.com/haachico/readify-backend) (Node.js/Express)

### Live Demo & Project Structure

- **Live Demo:** [readify-lilac.vercel.app](https://readify-lilac.vercel.app/) (Frontend hosted on Vercel)
- **API Endpoints:** `backend/src/routes/`
- **Controllers:** `backend/src/controllers/`
- **Services:** `backend/src/services/`
- **Database Migrations:** `backend/migrations/`
- **Configuration:** `backend/src/config/`
- **Middleware:** `backend/src/middleware/`
- **Email Queue:** `backend/src/queues/`

### Deployment Notes

**Backend Cold Start:** The API is deployed on Render's free tier, which means the backend may sleep after 15 minutes of inactivity. When you first interact with the app (login, create post, etc.), there may be a 30-50 second delay on the first request while Render wakes up the server. Subsequent requests are instant. This is a known limitation of free-tier deployment and doesn't affect paid hosting.

---

## Summary

| Section               | Highlight                                                          |
| --------------------- | ------------------------------------------------------------------ |
| **Architecture**      | Layered MVC design (controllers → services → DB) with async queues |
| **Token Strategy**    | Dual-token pattern: short access + long refresh in httpOnly cookie |
| **Email Reliability** | Bull queue with 3 retries prevents email loss                      |
| **Data Privacy**      | Formatted responses hide PII, secure by default                    |
| **Notifications**     | Polling-based (not WebSocket) keeps UI fresh every 30s             |
| **Scalability**       | Stateless API, horizontal scaling ready                            |
| **Learning Mindset**  | Mistakes caught, always iterating toward production-grade          |
| **Next Focus**        | Standardizing response format, using PATCH instead of PUT          |

---

**Last Updated:** May 21, 2026
