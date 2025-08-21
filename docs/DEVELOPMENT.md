# Development Guide

## Overview

This guide covers the development workflow, coding standards, and best practices for the Patch Management System.

## Development Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Python 3.x
- Git
- VS Code (recommended)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd patch-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cd backend
   cp env.example .env.local
   # Edit .env.local with your values

   # Frontend
   cd ../frontend
   cp env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Project Structure

### Frontend (Next.js)

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (if needed)
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Basic UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts            # API client
│   │   ├── auth.ts           # Authentication utilities
│   │   └── utils.ts          # General utilities
│   ├── types/                # TypeScript type definitions
│   └── middleware.ts         # Next.js middleware
├── public/                   # Static assets
├── package.json              # Dependencies
└── tsconfig.json            # TypeScript configuration
```

### Backend (Express.js)

```
backend/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── authController.js
│   │   ├── assetController.js
│   │   └── patchController.js
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Asset.js
│   │   └── Patch.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── assets.js
│   │   └── patches.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/            # Business logic
│   │   └── patchService.js
│   ├── utils/               # Utility functions
│   │   ├── logger.js
│   │   └── helpers.js
│   └── config/              # Configuration
│       ├── database.js
│       └── constants.js
├── tests/                   # Test files
├── logs/                    # Application logs
├── server.js               # Main server file
└── package.json            # Dependencies
```

## Coding Standards

### JavaScript/TypeScript

#### General Rules

- Use **ES6+** features
- Prefer **const** over let, avoid var
- Use **arrow functions** for callbacks
- Use **template literals** for string interpolation
- Use **destructuring** for object/array access

#### Naming Conventions

- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Files**: kebab-case
- **Components**: PascalCase

#### Code Organization

```typescript
// 1. Imports (external libraries first)
import React from 'react';
import { useState, useEffect } from 'react';

// 2. Internal imports
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

// 3. Types/Interfaces
interface User {
  id: string;
  name: string;
  email: string;
}

// 4. Component
export const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  // 5. State
  const [isLoading, setIsLoading] = useState(false);

  // 6. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 7. Event handlers
  const handleSubmit = async () => {
    // Handler logic
  };

  // 8. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Backend (Node.js/Express)

#### File Structure

```javascript
// controllers/assetController.js
const Asset = require('../models/Asset');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user.id });
    
    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getAssets
};
```

#### Error Handling

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
```

## API Design

### RESTful Endpoints

- **GET** /api/resources - List resources
- **GET** /api/resources/:id - Get single resource
- **POST** /api/resources - Create resource
- **PUT** /api/resources/:id - Update resource
- **DELETE** /api/resources/:id - Delete resource

### Response Format

```json
{
  "success": true,
  "data": {
    // Resource data
  },
  "message": "Optional message",
  "count": 1
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Database Design

### Schema Guidelines

- Use **MongoDB** with Mongoose ODM
- Include **timestamps** for all models
- Use **references** for relationships
- Implement **validation** at schema level

### Example Schema

```javascript
// models/Asset.js
const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'Please provide a valid IP address'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', AssetSchema);
```

## Testing

### Frontend Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Backend Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/            # Integration tests
│   ├── api/
│   └── database/
└── e2e/                   # End-to-end tests
    └── workflows/
```

### Example Test

```javascript
// tests/unit/models/Asset.test.js
const mongoose = require('mongoose');
const Asset = require('../../../src/models/Asset');

describe('Asset Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create & save asset successfully', async () => {
    const validAsset = new Asset({
      name: 'Test Server',
      description: 'Test description',
      userId: new mongoose.Types.ObjectId()
    });
    
    const savedAsset = await validAsset.save();
    
    expect(savedAsset._id).toBeDefined();
    expect(savedAsset.name).toBe(validAsset.name);
  });
});
```

## Git Workflow

### Branch Naming

- **Feature**: `feature/feature-name`
- **Bugfix**: `bugfix/bug-description`
- **Hotfix**: `hotfix/urgent-fix`
- **Release**: `release/version-number`

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Test changes
- **chore**: Build/tool changes

Examples:
```
feat(auth): add JWT authentication
fix(api): resolve CORS issue
docs(readme): update installation instructions
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Create pull request
6. Code review
7. Merge to main

## Code Quality

### Linting

```bash
# Frontend
npm run lint

# Backend
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Performance

### Frontend Optimization

- Use **React.memo** for expensive components
- Implement **lazy loading** for routes
- Optimize **images** and assets
- Use **useMemo** and **useCallback** hooks

### Backend Optimization

- Implement **caching** (Redis)
- Use **database indexes**
- Implement **pagination**
- Use **compression** middleware

### Database Optimization

```javascript
// Create indexes for frequently queried fields
AssetSchema.index({ userId: 1, createdAt: -1 });
PatchSchema.index({ assetId: 1, status: 1 });
```

## Security

### Authentication

- Use **JWT tokens** with expiration
- Implement **refresh tokens**
- Hash passwords with **bcrypt**
- Use **HTTPS** in production

### Input Validation

```javascript
// Use express-validator
const { body, validationResult } = require('express-validator');

router.post('/assets', [
  body('name').notEmpty().withMessage('Name is required'),
  body('ipAddress').isIP().withMessage('Invalid IP address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Monitoring and Logging

### Logging

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Checks

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Troubleshooting

### Common Issues

#### Frontend

1. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **TypeScript Errors**
   ```bash
   # Check types
   npx tsc --noEmit
   ```

#### Backend

1. **MongoDB Connection**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :5000
   ```

### Debug Mode

```bash
# Frontend
DEBUG=* npm run dev

# Backend
DEBUG=* npm run dev
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/)

