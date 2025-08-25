# 🚀 Patch Management System - Setup Guide

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.x** - [Download here](https://www.python.org/downloads/)
- **MongoDB** - Choose one option below

## 🗄️ MongoDB Setup Options

### Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

3. **Update Environment Variables**
   ```bash
   cd backend
   # Copy env.example to .env
   cp env.example .env
   # Edit .env and update MONGODB_URI
   ```

### Option 2: Local MongoDB Installation

1. **Install MongoDB Community Edition**
   - Windows: [MongoDB Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [official guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. **Start MongoDB Service**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

## 🔧 Project Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend and backend dependencies
npm run install:all
```

### 2. Environment Configuration

#### Backend Environment
```bash
cd backend
cp env.example .env
```

Edit `backend/.env`:
```env
# Backend Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/patch-management-system
# OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Configuration (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment
```bash
cd frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:
```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start the Application

```bash
# From the root directory
npm run dev
```

This will start both:
- **Frontend**: http://localhost:5001
- **Backend**: http://localhost:5000

## 🧪 Testing the Setup

### 1. Check Backend Health
Visit: http://localhost:5000/health
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Test Frontend
Visit: http://localhost:5001
- You should be redirected to the login page
- Try registering a new user
- Test the login functionality

### 3. Test API Endpoints
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔍 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
1. **For Local MongoDB**:
   - Ensure MongoDB service is running
   - Check if MongoDB is installed correctly
   - Try: `mongod --version`

2. **For MongoDB Atlas**:
   - Verify connection string is correct
   - Check if IP is whitelisted in Atlas
   - Ensure username/password are correct

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Python Script Issues

**Error**: `Python executable not found`

**Solution**:
1. Ensure Python 3.x is installed
2. Add Python to PATH
3. Test: `python --version` or `python3 --version`

## 📁 Project Structure

```
patch-management-system/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── lib/             # Utilities and API client
│   └── package.json
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── config/          # Database and app config
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   └── package.json
├── scripts/                  # Python scripts
│   └── latest_version.py    # Windows winget integration
└── docs/                     # Documentation
```

## 🚀 Next Steps

1. **Create your first asset** in the dashboard
2. **Test patch scanning** functionality
3. **Explore the API documentation** in `docs/API.md`
4. **Review deployment options** in `docs/DEPLOYMENT.md`

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Check MongoDB connection status
4. Verify all environment variables are set correctly

---

**Happy patching! 🛡️**










