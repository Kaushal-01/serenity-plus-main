# Production Deployment Guide

Complete guide for deploying the realtime server to production.

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- MongoDB 6+ (replica set recommended)
- Redis 7+
- Nginx
- SSL certificate (Let's Encrypt recommended)

## Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

### 2. MongoDB Setup

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongosh
use serenity
db.createUser({
  user: "serenity_user",
  pwd: "strong_password_here",
  roles: [{ role: "readWrite", db: "serenity" }]
})
exit

# Update MongoDB connection string
MONGODB_URI=mongodb://serenity_user:strong_password_here@localhost:27017/serenity
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password (optional but recommended)
requirepass your_redis_password_here

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli
AUTH your_redis_password_here
PING  # Should return PONG
exit
```

### 4. Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/serenity-realtime
sudo chown -R $USER:$USER /var/www/serenity-realtime

# Clone/copy your code
cd /var/www/serenity-realtime
# Copy realtime-server files here

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Create .env file
nano .env
```

**.env file:**
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here
MONGODB_URI=mongodb://serenity_user:strong_password_here@localhost:27017/serenity
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info
```

### 5. PM2 Setup

```bash
# Start application with PM2
pm2 start dist/index.js --name serenity-realtime -i 2

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Run the command it outputs

# View logs
pm2 logs serenity-realtime

# Monitor
pm2 monit
```

**PM2 Ecosystem File (optional):**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'serenity-realtime',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

### 6. Nginx Setup

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/serenity-realtime
```

**Nginx configuration:**
```nginx
upstream socket_io_nodes {
    ip_hash;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name realtime.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name realtime.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/realtime.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/realtime.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/serenity-realtime-access.log;
    error_log /var/log/nginx/serenity-realtime-error.log;

    location / {
        proxy_pass http://socket_io_nodes;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # Buffering
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://socket_io_nodes/health;
        access_log off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/serenity-realtime /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d realtime.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### 8. Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 9. Monitoring Setup

**Health check cron:**
```bash
crontab -e
```

Add:
```
*/5 * * * * curl -f http://localhost:3001/health || pm2 restart serenity-realtime
```

**Log rotation:**
```bash
sudo nano /etc/logrotate.d/serenity-realtime
```

Add:
```
/var/www/serenity-realtime/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 $USER $USER
}
```

## Option 2: Docker Deployment

### Dockerfile

Create in `realtime-server/`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: serenity-mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: serenity
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - serenity-network

  redis:
    image: redis:7-alpine
    container_name: serenity-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - serenity-network

  realtime:
    build: .
    container_name: serenity-realtime
    restart: always
    environment:
      PORT: 3001
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      MONGODB_URI: mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/serenity?authSource=admin
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
      LOG_LEVEL: info
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis
    networks:
      - serenity-network
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

volumes:
  mongodb_data:
  redis_data:

networks:
  serenity-network:
    driver: bridge
```

**.env for Docker:**
```env
MONGO_ROOT_PASSWORD=strong_mongo_password
REDIS_PASSWORD=strong_redis_password
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

**Deploy:**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f realtime

# Scale
docker-compose up -d --scale realtime=4

# Stop
docker-compose down
```

## Option 3: Cloud Deployment (AWS, GCP, Azure)

### AWS Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize:
```bash
cd realtime-server
eb init -p node.js-18 serenity-realtime
```

3. Create environment:
```bash
eb create production-env
```

4. Set environment variables:
```bash
eb setenv NODE_ENV=production JWT_SECRET=xxx MONGODB_URI=xxx REDIS_HOST=xxx
```

5. Deploy:
```bash
eb deploy
```

### Google Cloud Run

1. Build container:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/serenity-realtime
```

2. Deploy:
```bash
gcloud run deploy serenity-realtime \
  --image gcr.io/PROJECT_ID/serenity-realtime \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,JWT_SECRET=xxx
```

### Heroku

1. Create app:
```bash
heroku create serenity-realtime
```

2. Add buildpack:
```bash
heroku buildpacks:set heroku/nodejs
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production JWT_SECRET=xxx
```

4. Deploy:
```bash
git push heroku main
```

## Performance Tuning

### Node.js Optimization

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" pm2 start dist/index.js
```

### Redis Optimization

Edit `/etc/redis/redis.conf`:
```
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

### MongoDB Optimization

```javascript
// Connection pooling
{
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000
}
```

## Monitoring & Alerts

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
```

### New Relic (optional)

```bash
npm install newrelic
```

Create `newrelic.js` and add at top of `index.ts`:
```javascript
require('newrelic');
```

### DataDog (optional)

```bash
npm install dd-trace
```

## Backup Strategy

### MongoDB Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://user:pass@localhost:27017/serenity" --out="/backup/mongodb_$DATE"
find /backup -type d -mtime +7 -exec rm -rf {} +
```

### Redis Backup

```bash
# Redis auto-saves to dump.rdb
# Copy periodically
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb
```

## Troubleshooting

### Check logs
```bash
pm2 logs serenity-realtime --lines 100
tail -f /var/log/nginx/serenity-realtime-error.log
```

### Check processes
```bash
pm2 status
pm2 monit
```

### Check ports
```bash
sudo netstat -tulpn | grep :3001
```

### Restart services
```bash
pm2 restart serenity-realtime
sudo systemctl restart nginx
sudo systemctl restart redis-server
```

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Redis password set
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (UFW)
- [ ] SSL/TLS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled (optional)
- [ ] Keep dependencies updated
- [ ] Regular security audits: `npm audit`
- [ ] Limit MongoDB/Redis access to localhost

## Update Strategy

```bash
# Pull latest code
cd /var/www/serenity-realtime
git pull

# Install dependencies
npm install

# Build
npm run build

# Restart (zero downtime)
pm2 reload serenity-realtime
```

## Cost Estimation

**Small Scale (100-1000 concurrent users):**
- VPS: $10-20/month (DigitalOcean, Linode)
- MongoDB Atlas Free Tier: $0
- Redis (included in VPS): $0
- SSL (Let's Encrypt): $0
- **Total: ~$15/month**

**Medium Scale (1000-10000 concurrent users):**
- VPS: $40-80/month
- MongoDB Atlas M10: $57/month
- Redis Cloud: $15/month
- **Total: ~$150/month**

**Large Scale (10000+ concurrent users):**
- Load Balancer: $20/month
- App Servers (3x): $120/month
- MongoDB Atlas M30: $340/month
- Redis Enterprise: $100/month
- **Total: ~$600/month**
