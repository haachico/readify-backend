# WebSocket Implementation Guide - Readify Chat Feature

**Purpose:** Complete guide to understanding and implementing real-time chat using WebSocket + Socket.io

---

## Table of Contents

1. [WebSocket Basics](#websocket-basics)
2. [HTTP vs WebSocket](#http-vs-websocket)
3. [Connection Handshake](#connection-handshake)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Message Flow (End-to-End)](#message-flow-end-to-end)
7. [Code Implementation](#code-implementation)
8. [Real-world Scenarios](#real-world-scenarios)

---

## WebSocket Basics

### What is WebSocket?

**WebSocket** is a protocol that enables **two-way real-time communication** between client (browser) and server over a single persistent connection.

**Key characteristics:**

- ✅ Persistent connection (stays open)
- ✅ Bidirectional (both can send anytime)
- ✅ Low latency (~50ms vs ~150ms HTTP)
- ✅ Less bandwidth overhead
- ✅ Event-based messaging

### Socket.io (What We'll Use)

Socket.io is a **library on top of WebSocket** that makes it easier:

- Auto-reconnect if connection drops
- Fallback to polling if WebSocket unavailable
- Rooms & broadcasting
- Namespace support

---

## HTTP vs WebSocket

### HTTP (Current Polling Model in Readify)

```
Timeline:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Frontend         Server                                    │
│     │               │                                        │
│     ├─ GET /notifications ──────→                           │
│     │               │ (Check for new messages)              │
│     ←───────────────┤                                        │
│     │ (Connection closes)                                   │
│     │               │                                        │
│     Wait 30 seconds...                                      │
│     │               │                                        │
│     ├─ GET /notifications ──────→  (Repeat)               │
│     ←───────────────┤                                        │
│     (Connection closes)                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Issues:
❌ 30 second delay (polling interval)
❌ Wasted requests (many return "no new messages")
❌ High bandwidth (HTTP headers repeated)
❌ Not truly real-time
```

### WebSocket (Real-time Model)

```
Timeline:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Frontend              Server                               │
│     │                    │                                   │
│     │ UPGRADE (HTTP)     │                                   │
│     ├──────────────────→ │                                   │
│     │ ← 101 Switching   │  (Handshake complete)            │
│     │                    │                                   │
│  ═══════ WebSocket Connection Established ═══════            │
│  (Stays open, persistent tunnel)                            │
│     │                    │                                   │
│     │◄─── Ready ────────│                                   │
│     │                    │                                   │
│ User A sends message:   │                                   │
│     ├─ emit('msg', 'Hi') ─→                                │
│     │                    ├─ Save to DB                      │
│     │                    ├─ Send to User B                  │
│     │                    │                                   │
│     │                ┌────User B connected somewhere else──┐│
│     │                │                                      ││
│     │◄─ (broadcast) ─ emit('msg', 'Hi from A')            ││
│     │                │                                      ││
│     Show message!   │ Show message!                         ││
│     (Instant ~50ms) │                                       ││
│                     └──────────────────────────────────────┘│
│                                                              │
│  Connection stays open for more messages...                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Benefits:
✅ <100ms latency (instant feel)
✅ No polling overhead
✅ Efficient bandwidth usage
✅ Truly real-time
✅ Both can send anytime
```

---

## Connection Handshake

### Step-by-Step: How WebSocket Connection Happens

```
1️⃣  BROWSER INITIATES
    ┌─────────────────────────────────────┐
    │ const socket = io('http://...')     │
    │                                     │
    │ Sends HTTP request:                │
    │ GET /socket.io/?transport=ws HTTP/1.1
    │ Upgrade: websocket                 │
    │ Connection: Upgrade                │
    │ Sec-WebSocket-Key: x3JJHMbDL1EzLk  │
    └─────────────────────────────────────┘
           ↓
           ↓ (Travels over network)
           ↓

2️⃣  SERVER RECEIVES REQUEST
    ┌─────────────────────────────────────┐
    │ Server receives upgrade request     │
    │ (still HTTP at this point)          │
    │                                     │
    │ Check:                              │
    │ ✓ Valid upgrade request?            │
    │ ✓ WebSocket protocol supported?     │
    │ ✓ Is client authenticated (JWT)?    │
    │ ✓ Can user connect?                 │
    └─────────────────────────────────────┘
           ↓
           ↓ (Decision: Approve or Reject)
           ↓

3️⃣  SERVER RESPONDS
    ┌─────────────────────────────────────┐
    │ HTTP/1.1 101 Switching Protocols    │
    │ Upgrade: websocket                  │
    │ Connection: Upgrade                 │
    │ Sec-WebSocket-Accept: HSmrc0...     │
    │                                     │
    │ (Empty body - switching protocols)  │
    └─────────────────────────────────────┘
           ↓
           ↓ (Connection upgrades!)
           ↓

4️⃣  WEBSOCKET TUNNEL ESTABLISHED
    ┌─────────────────────────────────────┐
    │ HTTP connection becomes WebSocket   │
    │                                     │
    │ Both sides now have persistent      │
    │ bidirectional channel               │
    │                                     │
    │ Events can flow both ways instantly │
    └─────────────────────────────────────┘

Timing: ~500ms-1s for handshake
Result: Connection stays open until browser closes or network drops
```

---

## Backend Architecture

### Server-Side Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Server (Node.js/Express)              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ server.js (Main Entry)                               │ │
│  │ ┌─────────────────────────────────────────────────┐  │ │
│  │ │ const io = require('socket.io')(server)        │  │ │
│  │ │ io.use(authMiddleware) // Authenticate users   │  │ │
│  │ │ io.on('connection', (socket) => { ... })       │  │ │
│  │ └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                │
│                           ↓                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Socket Connection Handler                            │ │
│  │ ┌─────────────────────────────────────────────────┐  │ │
│  │ │ socket.on('send_message', async (msg) => {     │  │ │
│  │ │   // Handle incoming message                   │  │ │
│  │ │   // Validate data                             │  │ │
│  │ │   // Save to database                          │  │ │
│  │ │   // Emit to recipient                         │  │ │
│  │ │ })                                             │  │ │
│  │ │                                                │  │ │
│  │ │ socket.on('disconnect', () => {                │  │ │
│  │ │   // Clean up when user leaves                │  │ │
│  │ │ })                                             │  │ │
│  │ └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                │
│         ┌─────────────────┼─────────────────┐             │
│         ↓                 ↓                 ↓             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   MySQL DB  │  │   Redis     │  │ Other Users'│      │
│  │             │  │   Cache     │  │  Sockets    │      │
│  │ - Messages  │  │             │  │             │      │
│  │ - Users     │  │             │  │ (to emit)   │      │
│  │ - Chat      │  │             │  │             │      │
│  │   Rooms     │  │             │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Backend Components

**1. Socket.io Server Setup**

```javascript
// In server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST']
  }
});

// Authenticate before allowing connection
io.use(authMiddleware);

// Handle connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Message handler
  socket.on('send_message', (msg) => { ... });

  // Disconnect handler
  socket.on('disconnect', () => { ... });
});

server.listen(5000, () => console.log('Server running'));
```

**2. Message Handling Service**

```javascript
// In chatService.js
async function saveMessage(senderId, recipientId, text) {
  return await db.query(
    "INSERT INTO messages (sender_id, recipient_id, text, created_at) VALUES (?, ?, ?, NOW())",
    [senderId, recipientId, text],
  );
}

async function getConversation(userId, otherUserId) {
  return await db.query(
    "SELECT * FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) ORDER BY created_at",
    [userId, otherUserId, otherUserId, userId],
  );
}
```

**3. Socket Event Handling**

```javascript
io.on("connection", (socket) => {
  const userId = socket.auth.userId; // From JWT

  // User joins specific chat room
  socket.on("join_chat", (otherUserId) => {
    const roomName = [userId, otherUserId].sort().join("_");
    socket.join(roomName);
    console.log(`User ${userId} joined chat with ${otherUserId}`);
  });

  // User sends message
  socket.on("send_message", async (data) => {
    const { recipientId, text } = data;

    // Validate
    if (!text || !recipientId) return;

    // Save to DB
    const msg = await chatService.saveMessage(userId, recipientId, text);

    // Emit to recipient (if online)
    const roomName = [userId, recipientId].sort().join("_");
    io.to(roomName).emit("receive_message", {
      id: msg.insertId,
      senderId: userId,
      text: text,
      createdAt: new Date(),
    });
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });
});
```

---

## Frontend Architecture

### Client-Side Structure

```
┌──────────────────────────────────────────────────────────────┐
│                    React Frontend (Browser)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ App.js (Main)                                          │ │
│  │ ├─ Imports ChatContext                                │ │
│  │ └─ Wraps app with <ChatProvider>                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ChatContext.jsx (State Management)                    │ │
│  │ ┌──────────────────────────────────────────────────┐  │ │
│  │ │ const socket = io('http://localhost:5000', {   │  │ │
│  │ │   auth: { token: localStorage.getItem(...) }   │  │ │
│  │ │ })                                              │  │ │
│  │ │                                                 │  │ │
│  │ │ // Listen for messages                         │  │ │
│  │ │ socket.on('receive_message', (msg) => {        │  │ │
│  │ │   setMessages([...messages, msg])              │  │ │
│  │ │ })                                             │  │ │
│  │ │                                                 │  │ │
│  │ │ // Send message                                │  │ │
│  │ │ const sendMsg = (text) => {                    │  │ │
│  │ │   socket.emit('send_message', {                │  │ │
│  │ │     recipientId: 123,                          │  │ │
│  │ │     text: text                                 │  │ │
│  │ │   })                                           │  │ │
│  │ │ }                                              │  │ │
│  │ └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Chat.jsx Component                                     │ │
│  │ ├─ Displays messages                                  │ │
│  │ ├─ Input box                                          │ │
│  │ └─ Send button (calls sendMsg)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  State in Memory:                                          │
│  ├─ messages: []                                           │
│  ├─ socket: Socket object                                 │
│  ├─ isConnected: boolean                                  │
│  └─ users: {}                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Message Flow (End-to-End)

### Complete Flow: User A sends message to User B

```
┌──────────────────────────────────────────────────────────────────┐
│                       STEP 1: CONNECTION                         │
└──────────────────────────────────────────────────────────────────┘

User A (Browser):                  Server:                  User B (Browser):
   │                                 │                              │
   ├─ socket = io(...) ───────────→  │                              │
   │                                 ├─ Verify JWT                 │
   │                         ← 101 Switching Protocols ─────→     │
   │                                 │                              │
   │◄─── socket.on('connect') ────  │  ─ socket.on('connect') ───│
   │                                 │                              │
   ├─ Join chat room ─────────────→  │                              │
   │   'join_chat(userB)'             ├─ socket.join(roomName)     │
   │                                 │                              │
   │◄────────────── Ready for messages ──────────────────────────→│

┌──────────────────────────────────────────────────────────────────┐
│                    STEP 2: SEND MESSAGE                          │
└──────────────────────────────────────────────────────────────────┘

User A Types: "Hi B! How are you?"
User A Clicks: Send Button

User A (Browser):
   │
   ├─ handleSendMessage()
   │  └─ Validates text not empty
   │  └─ socket.emit('send_message', {
   │       recipientId: userBId,
   │       text: "Hi B! How are you?"
   │     })
   │
   ├─ Immediately shows in UI (optimistic)
   │  setMessages([...messages, {
   │    text: "Hi B! How are you?",
   │    fromMe: true,
   │    createdAt: now()
   │  }])
   │
   └──→ (Message travels through WebSocket) ──→

                    Server (Node.js):
                    │
                    ├─ socket.on('send_message')
                    │
                    ├─ Validate message:
                    │  ✓ Text not empty?
                    │  ✓ Recipient exists?
                    │  ✓ Sender authenticated?
                    │
                    ├─ Save to database:
                    │  INSERT INTO messages
                    │  (sender_id, recipient_id, text, created_at)
                    │
                    ├─ Generate response:
                    │  {
                    │    id: 12345,
                    │    senderId: userAId,
                    │    text: "Hi B! How are you?",
                    │    createdAt: "2026-05-21T10:30:00Z"
                    │  }
                    │
                    └─ Emit to chat room:
                       io.to('roomName')
                         .emit('receive_message', msgObject)

                       (Sends to BOTH User A & User B)

┌──────────────────────────────────────────────────────────────────┐
│                   STEP 3: RECEIVE MESSAGE                        │
└──────────────────────────────────────────────────────────────────┘

                                    ←─ (Message travels back) ←─

User A (Browser):                              User B (Browser):
   │                                              │
   ├─ socket.on('receive_message')              │
   │  ├─ Message already showing                │
   │     (optimistic update)                    │
   │  └─ Confirm with server data               │
   │                                            │
   │                              User B's browser:
   │                              │
   │                              ├─ socket.on('receive_message')
   │                              │
   │                              ├─ Add to messages state
   │                              │  setMessages([...messages, {
   │                              │    id: 12345,
   │                              │    fromId: userAId,
   │                              │    text: "Hi B! How are you?",
   │                              │    createdAt: "2026-05-21T10:30:00Z"
   │                              │  }])
   │                              │
   │                              ├─ UI Re-renders
   │                              │
   │                              ├─ Message appears in chat window
   │                              │  (Took ~100ms from send to show!)
   │                              │
   │                              └─ Optional: Play notification sound

┌──────────────────────────────────────────────────────────────────┐
│                    STEP 4: USER B RESPONDS                       │
└──────────────────────────────────────────────────────────────────┘

User B Types: "I'm good, thanks!"
User B Clicks: Send

User B:
   └─ socket.emit('send_message', {
       recipientId: userAId,
       text: "I'm good, thanks!"
     })

Server:
   └─ Same process (save, emit)
   └─ io.to('roomName').emit('receive_message', ...)

User A:
   └─ Receives message instantly ✨

┌──────────────────────────────────────────────────────────────────┐
│                   END RESULT (Chat Window)                       │
└──────────────────────────────────────────────────────────────────┘

User A's Screen:                User B's Screen:

[Chat Window]                  [Chat Window]
┌────────────────────┐         ┌────────────────────┐
│ 10:30               │         │ 10:30               │
│ You: Hi B!          │         │ User A: Hi B!       │
│ How are you?        │         │ How are you?        │
│                    │         │                    │
│ 10:30               │         │ 10:31               │
│ User B:             │         │ You: I'm good,      │
│ I'm good, thanks!   │         │ thanks!             │
│                    │         │                    │
└────────────────────┘         └────────────────────┘
  [Type message...]              [Type message...]
   [Send]                          [Send]

Both see same messages in real-time! ✅
```

---

## Code Implementation

### Full Backend Code

**File: `backend/src/services/chatService.js`**

```javascript
const pool = require("../config/db");

const chatService = {
  // Save message to database
  async saveMessage(senderId, recipientId, text) {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender_id, recipient_id, text, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())",
        [senderId, recipientId, text],
      );
      return result[0].insertId;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  },

  // Get conversation between two users
  async getConversation(userId, otherUserId, limit = 50) {
    try {
      const messages = await pool.query(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND recipient_id = ?) 
         OR (sender_id = ? AND recipient_id = ?) 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, otherUserId, otherUserId, userId, limit],
      );

      // Mark as read
      await pool.query(
        "UPDATE messages SET is_read = TRUE WHERE recipient_id = ? AND sender_id = ? AND is_read = FALSE",
        [userId, otherUserId],
      );

      return messages[0].reverse();
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  },

  // Get all conversations for a user
  async getUserConversations(userId) {
    try {
      const conversations = await pool.query(
        `SELECT DISTINCT 
          CASE 
            WHEN sender_id = ? THEN recipient_id 
            ELSE sender_id 
          END as other_user_id,
          (SELECT text FROM messages m2 
           WHERE (m2.sender_id = ? AND m2.recipient_id = other_user_id) 
           OR (m2.sender_id = other_user_id AND m2.recipient_id = ?)
           ORDER BY m2.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages m2 
           WHERE (m2.sender_id = ? AND m2.recipient_id = other_user_id) 
           OR (m2.sender_id = other_user_id AND m2.recipient_id = ?)
           ORDER BY m2.created_at DESC LIMIT 1) as last_message_time
         FROM messages 
         WHERE sender_id = ? OR recipient_id = ?
         ORDER BY last_message_time DESC`,
        [userId, userId, userId, userId, userId, userId, userId],
      );

      return conversations[0];
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  },
};

module.exports = chatService;
```

**File: `backend/src/controllers/chatController.js`**

```javascript
const chatService = require("../services/chatService");

const chatController = {
  // Get conversation history
  async getConversation(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.auth.userId;

      const messages = await chatService.getConversation(currentUserId, userId);

      res.json({
        success: true,
        messages,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error loading conversation",
        error: error.message,
      });
    }
  },

  // Get all conversations
  async getConversations(req, res) {
    try {
      const userId = req.auth.userId;
      const conversations = await chatService.getUserConversations(userId);

      res.json({
        success: true,
        conversations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error loading conversations",
        error: error.message,
      });
    }
  },
};

module.exports = chatController;
```

**File: `backend/src/routes/chatRoutes.js`**

```javascript
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get specific conversation
router.get("/conversations/:userId", chatController.getConversation);

// Get all conversations
router.get("/conversations", chatController.getConversations);

module.exports = router;
```

**File: `backend/server.js` (Modified)**

```javascript
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const chatService = require("./src/services/chatService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/posts", require("./src/routes/postRoutes"));
app.use("/api/chats", require("./src/routes/chatRoutes"));

// ====== WEBSOCKET SETUP ======

// Authentication middleware for socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.auth = {
      userId: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Handle socket connections
io.on("connection", (socket) => {
  const userId = socket.auth.userId;
  console.log(`✅ User ${userId} connected with socket ${socket.id}`);

  // Join user to personal room (for direct targeting)
  socket.join(`user_${userId}`);

  // -------- JOIN CHAT ROOM --------
  socket.on("join_chat", (data) => {
    const { otherUserId } = data;

    // Create deterministic room name
    const roomName = [userId, otherUserId].sort().join("_");
    socket.join(roomName);

    console.log(`User ${userId} joined chat with ${otherUserId}`);

    // Notify the other user
    io.to(`user_${otherUserId}`).emit("user_online", {
      userId: userId,
      isOnline: true,
    });
  });

  // -------- SEND MESSAGE --------
  socket.on("send_message", async (data) => {
    try {
      const { recipientId, text } = data;

      // Validation
      if (!text || !text.trim()) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      if (!recipientId) {
        socket.emit("error", { message: "Recipient not specified" });
        return;
      }

      // Save to database
      const messageId = await chatService.saveMessage(
        userId,
        recipientId,
        text.trim(),
      );

      // Create message object to send
      const messageObject = {
        id: messageId,
        senderId: userId,
        recipientId: recipientId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      // Determine room and emit
      const roomName = [userId, recipientId].sort().join("_");
      io.to(roomName).emit("receive_message", messageObject);

      console.log(`Message from ${userId} to ${recipientId} saved and sent`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // -------- TYPING INDICATOR (Optional) --------
  socket.on("typing", (data) => {
    const { recipientId } = data;
    const roomName = [userId, recipientId].sort().join("_");

    io.to(roomName).emit("user_typing", {
      userId: userId,
      isTyping: true,
    });
  });

  socket.on("stop_typing", (data) => {
    const { recipientId } = data;
    const roomName = [userId, recipientId].sort().join("_");

    io.to(roomName).emit("user_typing", {
      userId: userId,
      isTyping: false,
    });
  });

  // -------- MARK AS READ --------
  socket.on("mark_as_read", async (data) => {
    const { senderId } = data;

    try {
      await pool.query(
        "UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE",
        [senderId, userId],
      );

      io.to(`user_${senderId}`).emit("messages_read", {
        readBy: userId,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  });

  // -------- DISCONNECT --------
  socket.on("disconnect", () => {
    console.log(`❌ User ${userId} disconnected`);

    // Notify other users
    io.emit("user_offline", {
      userId: userId,
      isOnline: false,
    });
  });

  // -------- ERROR HANDLING --------
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

### Full Frontend Code

**File: `frontend/src/context/ChatContext.jsx`**

```javascript
import React, { createContext, useState, useEffect } from "react";
import io from "socket.io-client";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    const newSocket = io(
      process.env.REACT_APP_SERVER_URL || "http://localhost:5000",
      {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      },
    );

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
    });

    // Message events
    newSocket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Typing indicator
    newSocket.on("user_typing", (data) => {
      const { userId, isTyping } = data;
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    });

    // User online status
    newSocket.on("user_online", (data) => {
      const { userId, isOnline } = data;
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: isOnline,
      }));
    });

    newSocket.on("user_offline", (data) => {
      const { userId } = data;
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: false,
      }));
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load conversation history
  const loadConversation = async (otherUserId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL || "http://localhost:5000"}/api/chats/conversations/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to load conversation");

      const data = await response.json();
      setMessages(data.messages);
      setCurrentChat(otherUserId);

      // Join chat room
      if (socket) {
        socket.emit("join_chat", { otherUserId });
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Send message
  const sendMessage = (text) => {
    if (!socket || !currentChat || !text.trim()) return;

    socket.emit("send_message", {
      recipientId: currentChat,
      text: text.trim(),
    });

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderId: localStorage.getItem("userId"),
        recipientId: currentChat,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        fromMe: true,
      },
    ]);
  };

  // Typing indicator
  const notifyTyping = (isTyping) => {
    if (!socket || !currentChat) return;

    if (isTyping) {
      socket.emit("typing", { recipientId: currentChat });
    } else {
      socket.emit("stop_typing", { recipientId: currentChat });
    }
  };

  // Mark messages as read
  const markAsRead = () => {
    if (!socket || !currentChat) return;

    socket.emit("mark_as_read", {
      senderId: currentChat,
    });
  };

  const value = {
    socket,
    isConnected,
    messages,
    currentChat,
    conversations,
    typingUsers,
    onlineUsers,
    loadConversation,
    sendMessage,
    notifyTyping,
    markAsRead,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
```

**File: `frontend/src/components/Chat.jsx`**

```javascript
import React, { useState, useContext, useEffect, useRef } from "react";
import { ChatContext } from "../context/ChatContext";
import "../styles/Chat.css";

const Chat = ({ userId }) => {
  const {
    messages,
    sendMessage,
    notifyTyping,
    markAsRead,
    typingUsers,
    onlineUsers,
    isConnected,
  } = useContext(ChatContext);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when viewing conversation
  useEffect(() => {
    markAsRead();
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Notify typing
    notifyTyping(true);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;

    sendMessage(inputValue);
    setInputValue("");
    notifyTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Connection Status */}
      <div className="chat-header">
        <div className="status-indicator">
          <span className={`dot ${isConnected ? "online" : "offline"}`}></span>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {/* Messages Display */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.fromMe ? "sent" : "received"}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {Object.values(typingUsers).some((v) => v) && (
          <div className="message received">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows="2"
          disabled={!isConnected}
          className="chat-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !inputValue.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
```

**File: `frontend/src/styles/Chat.css`**

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  background: #fff;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.online {
  background: #4caf50;
}

.dot.offline {
  background: #f44336;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  margin-bottom: 10px;
}

.message.sent {
  justify-content: flex-end;
}

.message.received {
  justify-content: flex-start;
}

.message-content {
  background: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  max-width: 60%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.sent .message-content {
  background: #007bff;
  color: white;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 5px;
  display: block;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 15px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    opacity: 0.5;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.chat-input-container {
  background: #fff;
  padding: 15px;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  resize: none;
}

.chat-input:disabled {
  background: #f0f0f0;
  color: #999;
}

.send-button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.send-button:hover:not(:disabled) {
  background: #0056b3;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

---

## Real-world Scenarios

### Scenario 1: User A Sends While User B Offline

```
Timeline:

10:00 - User A sends: "Hi B!"
  ├─ Message saved to DB ✓
  ├─ Server looks for User B in connected sockets
  ├─ User B not found (offline)
  └─ Server just stores in DB, doesn't emit to socket

10:05 - User B comes online
  ├─ WebSocket connection established
  ├─ User B opens chat with User A
  ├─ Frontend calls: GET /api/chats/conversations/userA
  ├─ Backend returns all messages from DB (including 10:00 message)
  └─ User B sees: "User A: Hi B!" ✓

Result: No messages lost! ✅
```

### Scenario 2: Network Disconnection During Message

```
Timeline:

10:00 - User A sends message
  ├─ Message sent to server
  ├─ Network drops (WiFi cuts)
  ├─ Server doesn't receive
  ├─ Client doesn't get confirmation
  ├─ Socket.io auto-reconnect (exponential backoff)
  │   Attempt 1: 1s later
  │   Attempt 2: 2s later
  │   ...
  └─ Connection re-established

10:05 - Connection restored
  ├─ socket.io queued the message
  ├─ Automatically retries sending
  ├─ Server receives & saves
  └─ User B gets message ✓

Result: Resilient - handles network glitches! ✅
```

### Scenario 3: Multiple Devices Same User

```
User A (on Desktop):        User A (on Mobile):
├─ Socket ID: abc123        ├─ Socket ID: xyz789
└─ Logged in                └─ Logged in

When User A sends on Desktop:
├─ Desktop socket emits to server
├─ Server saves to DB
├─ Server emits to room
├─ Desktop receives (sees in chat)
├─ Mobile connected to same room
└─ Mobile also receives (sync across devices) ✅

Result: Seamless multi-device experience!
```

---

## Database Schema

```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,

  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,

  text TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),

  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_sender_recipient (sender_id, recipient_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_created_at (created_at)
);
```

---

## Deployment Checklist

- [ ] Install dependencies: `npm install socket.io`
- [ ] Create `messages` table in database
- [ ] Add Socket.io to `server.js`
- [ ] Create `ChatContext.jsx` and `Chat.jsx` components
- [ ] Update routes to include chat endpoints
- [ ] Test locally (both send and receive)
- [ ] Update frontend `.env` with server URL
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Test on live domain
- [ ] Monitor WebSocket connections

---

## Common Issues & Solutions

| Issue                    | Solution                                 |
| ------------------------ | ---------------------------------------- |
| "Connection refused"     | Check server URL, ensure backend running |
| Messages not appearing   | Verify auth token, check browser console |
| "auth error"             | JWT token invalid or expired, refresh    |
| Typing indicator lagging | Increase timeout, reduce emit frequency  |
| Memory leak              | Ensure sockets disconnect on logout      |
| High CPU usage           | Too many connections, scale server       |

---

**This is everything you need to understand and implement real-time chat!** 🚀
