# WebSocket Quick Reference

## 🚀 Quick Start Commands

```bash
# 1. Install realtime server
cd realtime-server
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start dependencies
mongod                    # Terminal 1
redis-server             # Terminal 2

# 4. Start realtime server
npm run dev              # Terminal 3

# 5. Start Next.js app
npm run dev              # Terminal 4 (in root)
```

## 📡 Server Events (Client → Server)

| Event | Parameters | Callback Response |
|-------|-----------|------------------|
| `send_message` | `{ receiverId, content }` | `{ success, message, error }` |
| `mark_messages_read` | `{ chatId }` | None |
| `join_room` | `{ roomId }` | `{ success, error }` |
| `leave_room` | `{ roomId }` | None |
| `room_message` | `{ roomId, content }` | `{ success, message, error }` |
| `typing_start` | `{ roomId }` | None |
| `typing_stop` | `{ roomId }` | None |
| `typing_start_dm` | `{ receiverId }` | None |
| `typing_stop_dm` | `{ receiverId }` | None |
| `get_online_friends` | None | `string[]` (userId array) |
| `join_audio_room` | `{ roomId }` | `{ success, state, error }` |
| `leave_audio_room` | `{ roomId }` | None |
| `play_track` | `{ roomId, trackId, track }` | None |
| `pause_track` | `{ roomId }` | None |
| `resume_track` | `{ roomId }` | None |
| `seek_track` | `{ roomId, position }` | None |
| `change_track` | `{ roomId, trackId, track }` | None |

## 📨 Client Events (Server → Client)

| Event | Data |
|-------|------|
| `new_message` | `Message` object |
| `message_sent` | `Message` object |
| `messages_read` | `{ chatId, userId }` |
| `room_message` | `RoomMessage` object |
| `room_user_joined` | `{ roomId, user }` |
| `room_user_left` | `{ roomId, userId }` |
| `typing` | `{ roomId, userId, username, isTyping }` |
| `typing_dm` | `{ userId, username, isTyping }` |
| `friend_online` | `{ userId, username }` |
| `friend_offline` | `{ userId, username }` |
| `audio_play` | `{ roomId, trackId, track, playedBy, timestamp }` |
| `audio_pause` | `{ roomId, position, pausedBy, timestamp }` |
| `audio_resume` | `{ roomId, resumedBy, timestamp }` |
| `audio_seek` | `{ roomId, position, seekedBy, timestamp }` |
| `audio_track_changed` | `{ roomId, trackId, track, changedBy, timestamp }` |
| `audio_user_joined` | `{ roomId, user }` |
| `audio_user_left` | `{ roomId, userId }` |

## 🎣 React Hooks API

### useChat(chatId, receiverId)
```javascript
const {
  messages,        // Message[]
  loading,         // boolean
  sending,         // boolean
  sendMessage,     // (content: string) => Promise<Message>
  markAsRead,      // () => void
  refreshMessages  // () => Promise<void>
} = useChat(chatId, receiverId);
```

### useRoom(roomId)
```javascript
const {
  messages,        // RoomMessage[]
  loading,         // boolean
  sending,         // boolean
  joined,          // boolean
  sendMessage,     // (content: string) => Promise<RoomMessage>
  joinRoom,        // () => Promise<void>
  leaveRoom,       // () => void
  refreshMessages  // () => Promise<void>
} = useRoom(roomId);
```

### usePresence()
```javascript
const {
  onlineFriends,   // string[] (userId array)
  isOnline,        // (userId: string) => boolean
  loading,         // boolean
  refresh          // () => void
} = usePresence();
```

### useAudioRoom(roomId)
```javascript
const {
  roomState,       // AudioRoomState | null
  joined,          // boolean
  participants,    // User[]
  audioRef,        // RefObject<HTMLAudioElement>
  joinRoom,        // () => Promise<AudioRoomState>
  leaveRoom,       // () => void
  playTrack,       // (trackId, track) => void
  pauseTrack,      // () => void
  resumeTrack,     // () => void
  seekTrack,       // (position: number) => void
  changeTrack      // (trackId, track) => void
} = useAudioRoom(roomId);
```

### useTyping(roomId?, receiverId?)
```javascript
const {
  isTyping,        // boolean
  typingUsers,     // string[] (userId array)
  startTyping,     // () => void
  stopTyping       // () => void
} = useTyping(roomId, receiverId);
```

### useSocket()
```javascript
const {
  socket,          // Socket | null
  isConnected,     // boolean
  reconnecting,    // boolean
  connect,         // () => Socket
  disconnect       // () => void
} = useSocket();
```

## 🔐 Environment Variables

### Realtime Server (.env)
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/serenity
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

### Next.js Client (.env.local)
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 📦 Key Dependencies

### Server
```json
{
  "socket.io": "^4.6.1",
  "@socket.io/redis-adapter": "^8.2.1",
  "ioredis": "^5.3.2",
  "mongodb": "^6.3.0",
  "jsonwebtoken": "^9.0.2",
  "express": "^4.18.2"
}
```

### Client
```json
{
  "socket.io-client": "^4.6.1"
}
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start in dev mode
npm run build            # Build TypeScript
npm start                # Start production

# PM2 (Production)
pm2 start dist/index.js --name serenity-realtime
pm2 restart serenity-realtime
pm2 logs serenity-realtime
pm2 monit
pm2 stop serenity-realtime

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
docker-compose up -d --scale realtime=4

# Database
mongosh                  # MongoDB shell
redis-cli                # Redis CLI
```

## 🐛 Debugging

```bash
# Enable debug logs
DEBUG=socket.io* npm run dev

# Check health
curl http://localhost:3001/health

# Test connection
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
socket.on('connect', () => console.log('Connected:', socket.id));
"
```

## 📊 MongoDB Indexes

```javascript
// Create all indexes
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.roommessages.createIndex({ roomId: 1, createdAt: -1 });
db.chats.createIndex({ participants: 1 });
db.rooms.createIndex({ members: 1 });
db.users.createIndex({ friends: 1 });
```

## 🚨 Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `Authentication token required` | No JWT in handshake | Pass token in `auth` |
| `Invalid token payload` | JWT missing userId/username | Check JWT structure |
| `Room not found` | Invalid roomId | Verify room exists in DB |
| `Access denied` | User not room member | Check permissions |
| `Validation error` | Invalid input | Check input format |

## 📁 File Locations

```
Server:
└── realtime-server/src/
    ├── index.ts              # Entry point
    ├── server.ts             # Socket.IO setup
    ├── middleware/auth.ts    # JWT auth
    ├── handlers/*.ts         # Event handlers
    ├── services/*.ts         # External services
    └── types/events.ts       # TypeScript types

Client:
└── src/
    ├── context/SocketContext.jsx
    └── hooks/use*.js
```

## 🔗 Useful Links

- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Redis Commands](https://redis.io/commands/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [PM2 Guide](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 💡 Tips

- Always validate user input on server
- Use ObjectId format for IDs (24 hex chars)
- Keep message content under 5000 chars
- Use `socket.data.userId` not client-provided userId
- Enable Redis persistence for production
- Use MongoDB replica sets for HA
- Monitor with `pm2 monit` in production
- Set up log rotation
- Use SSL/TLS in production (WSS)
- Test reconnection scenarios

## ✅ Health Checks

```bash
# Server health
curl http://localhost:3001/health

# MongoDB connection
mongosh --eval "db.runCommand({ ping: 1 })"

# Redis connection
redis-cli PING

# Socket.IO connection count
# Check pm2 logs or implement custom endpoint
```

## 🎯 Quick Troubleshooting

| Problem | Check |
|---------|-------|
| Can't connect | Is server running? Is JWT valid? CORS configured? |
| No messages | MongoDB running? Indexes created? |
| Presence not updating | Redis running? Heartbeat working? |
| Audio not syncing | Timestamp calculation? Audio element ref? |
| High memory | Clear Redis keys? Check PM2 memory limit? |

---

**For detailed docs, see:**
- README_WEBSOCKET.md
- MIGRATION_GUIDE.md
- DEPLOYMENT_GUIDE.md
- USAGE_EXAMPLES.md
