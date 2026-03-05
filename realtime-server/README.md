# Serenity Realtime Server

Production-ready WebSocket server for Serenity music social app, built with Socket.IO, Redis, and MongoDB.

## Features

✅ **1-1 Chat** - Direct messaging with real-time delivery and read receipts  
✅ **Text Rooms** - Public and private chat rooms  
✅ **Friend Presence** - Online/offline status tracking  
✅ **Typing Indicators** - Real-time typing notifications  
✅ **Audio Rooms** - Synchronized audio playback across multiple users  
✅ **JWT Authentication** - Secure socket authentication  
✅ **Horizontal Scaling** - Redis adapter for multi-instance deployment  
✅ **Zero Data Loss** - MongoDB persistence with optimized indexes  
✅ **Reconnection Handling** - Automatic reconnection and state restoration  

## Architecture

```
┌─────────────┐      WebSocket      ┌──────────────────┐
│   Next.js   │ ◄─────────────────► │  Socket.IO       │
│   Client    │                      │  Realtime Server │
└─────────────┘                      └──────────────────┘
                                              │
                                              ├─► Redis (Presence + Pub/Sub)
                                              └─► MongoDB (Persistence)
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Setup

1. **Install dependencies:**
```bash
cd realtime-server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/serenity
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=info
```

3. **Create MongoDB indexes:**
```bash
# See SCHEMAS.md for index creation script
```

4. **Build TypeScript:**
```bash
npm run build
```

5. **Start server:**
```bash
# Development
npm run dev

# Production
npm start
```

## Project Structure

```
realtime-server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # Socket.IO setup
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication
│   ├── handlers/
│   │   ├── chat.ts              # 1-1 chat
│   │   ├── rooms.ts             # Text rooms
│   │   ├── presence.ts          # Online/offline
│   │   ├── typing.ts            # Typing indicators
│   │   └── audioRooms.ts        # Audio sync
│   ├── services/
│   │   ├── redis.ts             # Redis client
│   │   ├── mongodb.ts           # MongoDB client
│   │   ├── presence.ts          # Presence service
│   │   └── audioRoomState.ts    # Audio room state
│   ├── types/
│   │   └── events.ts            # Event contracts
│   └── utils/
│       ├── logger.ts            # Logging
│       └── validation.ts        # Input validation
├── package.json
├── tsconfig.json
├── .env.example
├── SCHEMAS.md                   # Database schemas
└── README.md
```

## Client Integration

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Configure Environment

Add to your Next.js `.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Wrap App with SocketProvider

In your Next.js `app/layout.js`:

```jsx
import { SocketProvider } from '@/context/SocketContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
```

### 4. Use Hooks in Components

```jsx
import { useChat } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';
import { useAudioRoom } from '@/hooks/useAudioRoom';

function ChatComponent({ chatId, receiverId }) {
  const { messages, sendMessage, markAsRead } = useChat(chatId, receiverId);
  
  // ... component logic
}
```

## API Reference

### Chat Events

**Send Message:**
```javascript
socket.emit('send_message', {
  receiverId: '507f1f77bcf86cd799439011',
  content: 'Hello!'
}, (response) => {
  console.log(response.message);
});
```

**Receive Message:**
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### Room Events

**Join Room:**
```javascript
socket.emit('join_room', {
  roomId: '507f1f77bcf86cd799439022'
}, (response) => {
  if (response.success) {
    console.log('Joined room');
  }
});
```

**Send Room Message:**
```javascript
socket.emit('room_message', {
  roomId: '507f1f77bcf86cd799439022',
  content: 'Hello everyone!'
}, (response) => {
  console.log(response.message);
});
```

### Presence Events

**Get Online Friends:**
```javascript
socket.emit('get_online_friends', (friendIds) => {
  console.log('Online friends:', friendIds);
});
```

**Listen for Presence:**
```javascript
socket.on('friend_online', (data) => {
  console.log(`${data.username} is online`);
});

socket.on('friend_offline', (data) => {
  console.log(`${data.username} is offline`);
});
```

### Audio Room Events

**Join Audio Room:**
```javascript
socket.emit('join_audio_room', {
  roomId: '507f1f77bcf86cd799439033'
}, (response) => {
  console.log('Current state:', response.state);
});
```

**Play Track:**
```javascript
socket.emit('play_track', {
  roomId: '507f1f77bcf86cd799439033',
  trackId: 'track123',
  track: {
    id: 'track123',
    title: 'Song Name',
    artist: 'Artist Name',
    albumArt: 'https://...',
    duration: 180
  }
});
```

**Listen for Playback Events:**
```javascript
socket.on('audio_play', (data) => {
  // Sync local playback
  audioElement.src = data.track.url;
  audioElement.currentTime = 0;
  audioElement.play();
});

socket.on('audio_pause', (data) => {
  audioElement.pause();
  audioElement.currentTime = data.position;
});

socket.on('audio_seek', (data) => {
  audioElement.currentTime = data.position;
});
```

## Scaling

### Multi-Instance Deployment

The server uses Redis adapter for horizontal scaling. Deploy multiple instances behind a load balancer:

```bash
# Instance 1
PORT=3001 npm start

# Instance 2
PORT=3002 npm start

# Instance 3
PORT=3003 npm start
```

All instances share state through Redis pub/sub.

### Load Balancer Configuration

Configure sticky sessions for polling transport fallback:

**Nginx example:**
```nginx
upstream socket_servers {
    ip_hash;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://socket_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 3600
}
```

### Logs

Logs are written to stdout with structured format:

```
[2026-03-05T10:30:00.000Z] [INFO] Socket.IO server created successfully
[2026-03-05T10:30:01.000Z] [INFO] Client connected: abc123 {"userId":"507f...","username":"john"}
[2026-03-05T10:30:02.000Z] [DEBUG] Message sent from 507f... to 508f...
```

Configure log level in `.env`:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

## Security

### JWT Authentication

All socket connections require valid JWT token:

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

Token must include:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "profilePicture": "https://..."
}
```

### Input Validation

All user inputs are validated and sanitized:
- Maximum message length: 5000 characters
- ObjectId format validation
- XSS prevention (HTML escaping)

### CORS

Configure allowed origins in `.env`:
```env
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
```

## Troubleshooting

### Connection Issues

**Problem:** Client can't connect  
**Solution:** Check CORS settings and JWT token validity

**Problem:** Frequent disconnections  
**Solution:** Increase `pingTimeout` and `pingInterval` in server.ts

### Performance Issues

**Problem:** High latency  
**Solution:** 
- Ensure Redis is on same network
- Check MongoDB indexes
- Use WebSocket transport only: `transports: ['websocket']`

**Problem:** Memory leaks  
**Solution:**
- Check for unhandled event listeners
- Monitor presence cleanup
- Use Redis TTL for temporary data

### Debugging

Enable debug mode:
```bash
DEBUG=socket.io* npm run dev
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure MongoDB replica set
- [ ] Configure Redis with persistence
- [ ] Set up load balancer with sticky sessions
- [ ] Enable HTTPS/WSS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Configure log aggregation
- [ ] Test reconnection scenarios
- [ ] Load test with expected concurrent users

## License

MIT
