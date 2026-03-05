# Migration Guide: Polling to WebSockets

This guide helps you migrate from HTTP polling to WebSockets while maintaining existing functionality.

## Overview

The migration follows these principles:
1. **MongoDB remains the source of truth** - all data persistence unchanged
2. **REST APIs for initial fetch** - existing endpoints still used for page loads
3. **WebSockets for realtime updates** - replacing polling intervals
4. **Zero downtime migration** - gradual rollout possible
5. **Backward compatible** - old clients continue working during migration

## Migration Steps

### Phase 1: Server Setup (Week 1)

#### 1.1 Deploy Realtime Server

```bash
# Clone or create realtime-server directory
cd realtime-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Create MongoDB indexes
mongo < create-indexes.js

# Build and start
npm run build
npm start
```

#### 1.2 Verify Server Health

```bash
curl http://localhost:3001/health
curl http://localhost:3001/status
```

#### 1.3 Test Authentication

```javascript
// Test connection with valid JWT
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
  auth: { token: 'your-test-jwt-token' }
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error:', err.message);
});
```

### Phase 2: Client Integration (Week 2)

#### 2.1 Install Dependencies

```bash
npm install socket.io-client
```

#### 2.2 Add SocketProvider

Update `src/app/layout.js`:

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

#### 2.3 Update Environment

Add to `.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Production:
```env
NEXT_PUBLIC_SOCKET_URL=https://realtime.yourdomain.com
```

### Phase 3: Feature Migration

Migrate features one at a time in this order:

#### 3.1 Presence System (Day 1-2)

**Before (polling):**
```jsx
// Old component
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/friends/online');
    const data = await res.json();
    setOnlineFriends(data.online);
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

**After (realtime):**
```jsx
import { usePresence } from '@/hooks/usePresence';

function FriendsList() {
  const { onlineFriends, isOnline } = usePresence();
  
  // That's it! Real-time updates automatically
}
```

**Testing:**
- Open app in two browsers with different users
- Verify online/offline status updates instantly
- Test multiple tabs/devices per user
- Verify status persists across reconnections

#### 3.2 1-1 Chat (Day 3-4)

**Before (polling):**
```jsx
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/chat/${chatId}/messages`);
    const data = await res.json();
    setMessages(data.messages);
  }, 2000);
  
  return () => clearInterval(interval);
}, [chatId]);

const sendMessage = async (content) => {
  await fetch('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content })
  });
};
```

**After (realtime):**
```jsx
import { useChat } from '@/hooks/useChat';

function ChatView({ chatId, receiverId }) {
  const { messages, sendMessage, markAsRead } = useChat(chatId, receiverId);
  
  const handleSend = async () => {
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };
  
  useEffect(() => {
    markAsRead();
  }, [messages]);
}
```

**Testing:**
- Send messages between two users
- Verify instant delivery
- Test read receipts
- Test offline message queueing
- Verify no duplicate messages

#### 3.3 Typing Indicators (Day 5)

**Add to chat component:**
```jsx
import { useTyping } from '@/hooks/useTyping';

function ChatView({ receiverId }) {
  const { isTyping, startTyping, stopTyping } = useTyping(null, receiverId);
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    startTyping();
  };
  
  const handleSend = () => {
    stopTyping();
    // ... send message
  };
  
  return (
    <div>
      <input onChange={handleInputChange} />
      {isTyping && <p>User is typing...</p>}
    </div>
  );
}
```

**Testing:**
- Type in one client, verify indicator in other
- Verify indicator disappears after 3 seconds
- Test rapid typing/stopping

#### 3.4 Text Rooms (Day 6-7)

**Before (polling):**
```jsx
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/rooms/${roomId}/messages`);
    const data = await res.json();
    setMessages(data.messages);
  }, 3000);
  
  return () => clearInterval(interval);
}, [roomId]);
```

**After (realtime):**
```jsx
import { useRoom } from '@/hooks/useRoom';

function RoomView({ roomId }) {
  const { messages, sendMessage, joined } = useRoom(roomId);
  
  if (!joined) {
    return <p>Joining room...</p>;
  }
  
  return (
    <div>
      {messages.map(msg => <Message key={msg._id} {...msg} />)}
    </div>
  );
}
```

**Testing:**
- Join room from multiple clients
- Verify all users receive messages
- Test join/leave notifications
- Test private room access control

#### 3.5 Audio Rooms (Day 8-10)

**Implementation:**
```jsx
import { useAudioRoom } from '@/hooks/useAudioRoom';

function AudioRoomView({ roomId }) {
  const { 
    roomState, 
    audioRef,
    playTrack, 
    pauseTrack, 
    seekTrack 
  } = useAudioRoom(roomId);
  
  const handlePlayTrack = (track) => {
    playTrack(track.id, track);
  };
  
  return (
    <div>
      <audio ref={audioRef} src={roomState?.currentTrack?.url} />
      
      {roomState?.isPlaying ? (
        <button onClick={pauseTrack}>Pause</button>
      ) : (
        <button onClick={() => handlePlayTrack(selectedTrack)}>Play</button>
      )}
    </div>
  );
}
```

**Testing:**
- Play track from one client, verify all clients sync
- Test pause/resume synchronization
- Test seek synchronization
- Test latency compensation
- Test new user joining mid-playback
- Verify playback position accuracy

### Phase 4: Remove Polling Code (Week 3)

#### 4.1 Identify Polling Intervals

Search codebase for:
```bash
grep -r "setInterval" src/
grep -r "polling" src/
```

#### 4.2 Remove Old Code

For each polling instance:
1. Verify WebSocket replacement is working
2. Remove `setInterval` code
3. Remove associated state management
4. Test functionality still works

#### 4.3 Update REST APIs

Keep REST APIs for initial data fetch, but remove from polling:

**Keep this:**
```javascript
// Initial fetch when component mounts
const fetchInitialData = async () => {
  const res = await fetch('/api/chat/123/messages');
  // ...
};
```

**Remove this:**
```javascript
// Don't poll anymore
setInterval(() => {
  fetch('/api/chat/123/messages');
}, 2000);
```

### Phase 5: Production Deployment (Week 4)

#### 5.1 Infrastructure Setup

**Deploy Redis:**
```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine redis-server --save 60 1

# Or use managed service (AWS ElastiCache, Redis Cloud, etc.)
```

**Configure MongoDB Replica Set:**
```bash
# For production, use replica set for high availability
```

**Deploy Realtime Server:**
```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name serenity-realtime -i 2

# Or use Docker
docker build -t serenity-realtime .
docker run -d -p 3001:3001 serenity-realtime
```

#### 5.2 Load Balancer Setup

**Nginx:**
```nginx
upstream socket_io_nodes {
    ip_hash;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 443 ssl http2;
    server_name realtime.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /socket.io/ {
        proxy_pass http://socket_io_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

#### 5.3 SSL/TLS Configuration

Update client to use WSS:
```env
NEXT_PUBLIC_SOCKET_URL=https://realtime.yourdomain.com
```

#### 5.4 Monitoring Setup

**Health checks:**
```bash
*/1 * * * * curl -f http://localhost:3001/health || systemctl restart serenity-realtime
```

**Logging:**
```javascript
// Use log aggregation (DataDog, LogDNA, etc.)
// Or ELK stack for self-hosted
```

**Metrics:**
- Socket connections count
- Messages per second
- Redis memory usage
- MongoDB query performance
- WebSocket latency

## Rollback Plan

If issues occur, you can rollback gradually:

### Rollback Option 1: Feature-by-Feature

Disable specific features while keeping others:

```jsx
// Feature flag approach
const USE_WEBSOCKET_CHAT = process.env.NEXT_PUBLIC_USE_WS_CHAT === 'true';

function ChatView() {
  if (USE_WEBSOCKET_CHAT) {
    return <WebSocketChat />;
  } else {
    return <PollingChat />;
  }
}
```

### Rollback Option 2: Complete Rollback

1. Stop realtime server
2. Revert client code to use polling
3. Re-deploy Next.js app
4. Investigate issues
5. Fix and re-deploy

## Performance Comparison

### Before (Polling)

- **Latency:** 2-5 seconds (poll interval)
- **Server Load:** Constant requests every 2-5s per user
- **Bandwidth:** ~100KB/min per active user
- **Connections:** One HTTP request every 2-5s

### After (WebSockets)

- **Latency:** <100ms (real-time)
- **Server Load:** One persistent connection per user
- **Bandwidth:** ~1KB/min per active user (50x reduction)
- **Connections:** One WebSocket per user

### Expected Improvements

- **95% reduction** in latency
- **80% reduction** in server CPU usage
- **90% reduction** in bandwidth usage
- **Better UX** - instant updates, typing indicators, presence

## Common Issues

### Issue: "Authentication token required"

**Cause:** JWT token not sent in handshake  
**Fix:**
```javascript
const token = localStorage.getItem('token');
const socket = io(url, {
  auth: { token }
});
```

### Issue: Duplicate messages appearing

**Cause:** Message deduplication not working  
**Fix:** Check message._id is being tracked correctly in useChat hook

### Issue: Users showing offline when they're online

**Cause:** Presence service not tracking multiple sockets  
**Fix:** Verify Redis is running and accessible

### Issue: Audio not syncing properly

**Cause:** Latency compensation calculation off  
**Fix:** Check server timestamp vs client time, adjust compensation

## Testing Checklist

- [ ] Single user can connect and disconnect
- [ ] Multiple users can connect simultaneously
- [ ] Messages sent between users appear instantly
- [ ] Typing indicators work correctly
- [ ] Presence updates in real-time
- [ ] Room messages broadcast to all members
- [ ] Audio playback syncs across users
- [ ] Reconnection restores state correctly
- [ ] Multiple tabs per user work correctly
- [ ] Works on mobile devices
- [ ] Works in PWA mode
- [ ] Load test with expected concurrent users
- [ ] Network disconnection/reconnection handling
- [ ] Server restart doesn't lose data

## Support

If you encounter issues during migration:

1. Check server logs: `pm2 logs serenity-realtime`
2. Check browser console for client errors
3. Verify Redis and MongoDB connectivity
4. Test with minimal setup (single user, single feature)

## Next Steps

After successful migration:

1. **Monitor metrics** - track performance improvements  
2. **Gather feedback** - user experience with real-time features
3. **Optimize** - tune Redis/MongoDB based on actual usage
4. **Add features** - voice calls, video, screen sharing, etc.
5. **Scale** - add more server instances as user base grows
