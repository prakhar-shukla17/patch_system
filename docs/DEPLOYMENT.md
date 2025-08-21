# Deployment Guide

## Overview

This guide covers deploying the Patch Management System to various environments, from development to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Python 3.x (for Windows patch detection)
- Windows OS (for winget functionality)

## Environment Setup

### 1. Environment Variables

Create a `.env.local` file in the project root:

```env
# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/patch-management

# API Configuration
BACKEND_API_URL=http://localhost:3000

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Redis (for session storage)
REDIS_URL=redis://localhost:6379
```

### 2. Generate Secure Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate MongoDB connection string
# For local MongoDB: mongodb://localhost:27017/patch-management
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/patch-management
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB service
# Windows: MongoDB runs as a service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string from cluster settings
4. Update `MONGODB_URI` in `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Prepare the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB
sudo apt-get install -y mongodb

# Install Python 3
sudo apt-get install -y python3 python3-pip
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd patch-management-system

# Install dependencies
npm install

# Build application
npm run build

# Set environment variables
cp env.example .env.local
# Edit .env.local with production values

# Start with PM2
pm2 start npm --name "patch-management" -- start
pm2 save
pm2 startup
```

#### 3. Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Install Python for patch detection
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### 2. Create Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Cloud Platform Deployment

#### Vercel Deployment

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Connect repository to Vercel

2. **Configure Environment Variables**
   ```env
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   MONGODB_URI=your-mongodb-uri
   ```

3. **Deploy**
   - Vercel automatically builds and deploys on push

#### Railway Deployment

1. **Connect Repository**
   - Push code to GitHub
   - Connect to Railway

2. **Add Services**
   - Add MongoDB service
   - Configure environment variables

3. **Deploy**
   - Railway automatically deploys

#### Heroku Deployment

1. **Create Heroku App**
   ```bash
   heroku create your-patch-management-app
   ```

2. **Add MongoDB Add-on**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NEXTAUTH_SECRET=your-secret
   heroku config:set NEXTAUTH_URL=https://your-app.herokuapp.com
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## SSL/HTTPS Configuration

### Let's Encrypt (Nginx)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare

1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption mode: "Full (strict)"
4. Configure page rules for security

## Monitoring and Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs patch-management

# PM2 status
pm2 status
```

### Database Monitoring

```bash
# MongoDB status
sudo systemctl status mongod

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Health Checks

Create a health check endpoint:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/patch-management" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Application Backup

```bash
# Backup application files
tar -czf "app_backup_$(date +%Y%m%d_%H%M%S).tar.gz" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use strong, unique secrets
- Rotate secrets regularly

### 2. Database Security
- Use strong passwords
- Enable authentication
- Restrict network access
- Regular security updates

### 3. Application Security
- Keep dependencies updated
- Enable HTTPS
- Configure CORS properly
- Implement rate limiting

### 4. Server Security
- Regular system updates
- Firewall configuration
- SSH key authentication
- Disable root login

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval "db.runCommand('ping')"
```

#### 2. Python Script Issues
```bash
# Test Python script manually
python3 scripts/latest_version.py

# Check Python version
python3 --version

# Check winget availability
winget --version
```

#### 3. Application Startup Issues
```bash
# Check application logs
pm2 logs patch-management

# Check environment variables
pm2 env patch-management

# Restart application
pm2 restart patch-management
```

#### 4. Memory Issues
```bash
# Monitor memory usage
pm2 monit

# Increase Node.js memory limit
pm2 start npm --name "patch-management" -- start --max-old-space-size=4096
```

## Performance Optimization

### 1. Database Optimization
- Create indexes on frequently queried fields
- Monitor slow queries
- Regular database maintenance

### 2. Application Optimization
- Enable Next.js caching
- Optimize images and assets
- Use CDN for static files

### 3. Server Optimization
- Monitor resource usage
- Scale horizontally if needed
- Use load balancers for high traffic

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check application logs
   - Monitor disk space
   - Review security updates

2. **Monthly**
   - Update dependencies
   - Review backup integrity
   - Performance analysis

3. **Quarterly**
   - Security audit
   - Infrastructure review
   - Disaster recovery testing

