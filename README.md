# Patch Management System

A comprehensive enterprise patch management system built with Next.js frontend and Express.js backend, using MongoDB for data storage. This system allows you to monitor, manage, and deploy patches across multiple assets in your infrastructure.

## Features

- 🔐 **Authentication System** - Secure login/logout with JWT tokens
- 🖥️ **Multi-Asset Management** - Manage patches across multiple servers and workstations
- 🛡️ **Security-First Approach** - Prioritize critical security patches
- 📊 **Real-time Monitoring** - Get insights into patch status and system health
- 🔄 **Automated Scanning** - Integration with Windows winget for patch detection
- 📱 **Modern UI** - Clean, responsive interface built with Tailwind CSS
- 🏗️ **Microservices Architecture** - Separated frontend and backend for scalability

## Tech Stack

### Frontend
- **Framework**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: React hooks and context

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### Patch Detection
- **Script**: Python with Windows winget integration
- **Platform**: Windows OS (for winget functionality)

## Project Structure

```
patch-management-system/
├── 📁 frontend/                    # Next.js Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 app/                # Next.js App Router
│   │   │   ├── 📁 api/            # Next.js API routes (if needed)
│   │   │   ├── 📁 auth/           # Authentication pages
│   │   │   ├── 📁 dashboard/      # Main dashboard pages
│   │   │   └── 📁 globals.css     # Global styles
│   │   ├── 📁 components/         # Reusable React components
│   │   ├── 📁 lib/                # Utility libraries
│   │   ├── 📁 types/              # TypeScript type definitions
│   │   └── middleware.ts          # Next.js middleware
│   ├── package.json               # Frontend dependencies
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   └── tsconfig.json              # TypeScript configuration
├── 📁 backend/                     # Express.js Backend API
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # Route controllers
│   │   ├── 📁 models/             # MongoDB schemas
│   │   ├── 📁 routes/             # API routes
│   │   ├── 📁 middleware/         # Express middleware
│   │   ├── 📁 services/           # Business logic services
│   │   ├── 📁 utils/              # Utility functions
│   │   └── 📁 config/             # Configuration files
│   ├── 📁 tests/                  # Backend tests
│   ├── 📁 logs/                   # Application logs
│   ├── server.js                  # Main server file
│   └── package.json               # Backend dependencies
├── 📁 scripts/                     # Utility scripts
│   └── latest_version.py          # Windows patch detection script
├── 📁 docs/                        # Documentation
│   ├── API.md                     # API documentation
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── DEVELOPMENT.md             # Development guide
├── 📁 tests/                       # Test files
│   ├── 📁 unit/                   # Unit tests
│   ├── 📁 integration/            # Integration tests
│   └── 📁 e2e/                    # End-to-end tests
├── package.json                    # Root package.json (monorepo management)
├── env.example                     # Root environment variables template
└── README.md                       # Project documentation
```

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- Python 3.x (for Windows patch scanning functionality)
- Windows OS (for winget patch detection)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd patch-management-system

# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Environment Setup

**Backend Environment:**
```bash
cd backend
cp env.example .env.local
```

Update `backend/.env.local`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/patch-management
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:5001
```

**Frontend Environment:**
```bash
cd frontend
cp env.example .env.local
```

Update `frontend/.env.local`:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:5001
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Set Up MongoDB

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
4. Update `MONGODB_URI` in `backend/.env.local`

### 4. Run Development Servers

```bash
# Run both frontend and backend simultaneously
npm run dev

# Or run them separately:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

The application will be available at:
- **Frontend**: http://localhost:5001
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Development

### Available Scripts

**Root Level (Monorepo Management):**
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both applications
npm run start            # Start both in production mode
npm run test             # Run tests for both
npm run lint             # Lint both applications
npm run install:all      # Install dependencies for both
```

**Frontend Only:**
```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

**Backend Only:**
```bash
cd backend
npm run dev              # Start with nodemon
npm run start            # Start production server
npm run test             # Run Jest tests
npm run lint             # Run ESLint
```

### API Endpoints

The backend provides the following API endpoints:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets` - Create new asset
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

#### Patches
- `GET /api/patches/asset/:assetId` - Get patches for an asset
- `POST /api/patches/scan/:assetId` - Scan for patches
- `PUT /api/patches/:id` - Update patch status
- `GET /api/patches/stats` - Get patch statistics
- `DELETE /api/patches/:id` - Delete patch

## Database Schema

### User
- `email`: User email address
- `password`: Hashed password
- `name`: User's full name
- `role`: User role (ADMIN, USER)

### Asset
- `name`: Asset name
- `description`: Optional description
- `ipAddress`: IP address
- `osType`: Operating system type
- `userId`: Reference to owner

### Patch
- `name`: Application/patch name
- `currentVersion`: Currently installed version
- `latestVersion`: Latest available version
- `updateAvailable`: Boolean flag
- `severity`: CRITICAL, HIGH, MEDIUM, LOW
- `status`: PENDING, APPROVED, INSTALLED, FAILED, IGNORED
- `assetId`: Reference to asset

## Windows Patch Detection

The system integrates with Windows winget for patch detection:

1. **Script Location**: `scripts/latest_version.py`
2. **Execution**: The backend spawns a Python process when scanning for patches
3. **Output Parsing**: JSON output is parsed and stored in the database
4. **Error Handling**: Script failures are logged and reported to users

The Python script uses:
- `winget list` to get installed applications
- `winget upgrade` to check for available updates
- JSON output for easy parsing by the Node.js backend

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for session management
- API routes protected with authentication middleware
- Input validation on all endpoints
- CORS and security headers configured
- Rate limiting to prevent abuse

## Deployment

### Production Deployment

1. **Build Applications**
   ```bash
   npm run build
   ```

2. **Set Production Environment Variables**
   ```bash
   # Backend
   cd backend
   cp env.example .env.local
   # Edit with production values

   # Frontend
   cd frontend
   cp env.example .env.local
   # Edit with production values
   ```

3. **Start Applications**
   ```bash
   npm start
   ```

### Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/patch-management
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the API endpoints

## Roadmap

- [ ] Email notifications for critical patches
- [ ] Scheduled patch scanning
- [ ] Patch deployment automation
- [ ] Advanced reporting and analytics
- [ ] Integration with patch management tools
- [ ] Multi-tenant support
- [ ] Mobile application
- [ ] Linux/macOS support
- [ ] Patch rollback functionality

---

**Note**: Remember to keep your MongoDB connection string and JWT secret secure. Never commit sensitive information to version control.


