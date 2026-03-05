// Simple in-memory cache for user data
const userCache = new Map();
const CACHE_TTL = 60000; // 1 minute

export function getCachedUsers(userIds) {
  const now = Date.now();
  const cached = [];
  const missing = [];
  
  for (const id of userIds) {
    const entry = userCache.get(id.toString());
    if (entry && now - entry.timestamp < CACHE_TTL) {
      cached.push(entry.data);
    } else {
      missing.push(id);
    }
  }
  
  return { cached, missing };
}

export function cacheUsers(users) {
  const now = Date.now();
  for (const user of users) {
    userCache.set(user._id.toString(), {
      data: user,
      timestamp: now
    });
  }
}

export function clearUserCache() {
  userCache.clear();
}
