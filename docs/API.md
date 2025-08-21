# API Documentation

## Overview

The Patch Management System provides a RESTful API for managing assets, patches, and user authentication. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication. Include the session cookie in your requests or use the NextAuth.js session.

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Sign In
```http
POST /api/auth/[...nextauth]
```

Uses NextAuth.js for authentication.

### Assets

#### List All Assets
```http
GET /api/assets
```

**Response:**
```json
[
  {
    "_id": "asset_id",
    "name": "Server-01",
    "description": "Production web server",
    "ipAddress": "192.168.1.100",
    "osType": "Windows Server 2022",
    "userId": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Asset
```http
POST /api/assets
```

**Request Body:**
```json
{
  "name": "Server-01",
  "description": "Production web server",
  "ipAddress": "192.168.1.100",
  "osType": "Windows Server 2022"
}
```

#### Get Asset Details
```http
GET /api/assets/{id}
```

#### Update Asset
```http
PUT /api/assets/{id}
```

**Request Body:**
```json
{
  "name": "Server-01-Updated",
  "description": "Updated description",
  "ipAddress": "192.168.1.101",
  "osType": "Windows Server 2022"
}
```

#### Delete Asset
```http
DELETE /api/assets/{id}
```

### Patches

#### Get Patches for Asset
```http
GET /api/assets/{assetId}/patches
```

**Response:**
```json
[
  {
    "_id": "patch_id",
    "name": "Google Chrome",
    "currentVersion": "120.0.6099.109",
    "latestVersion": "120.0.6099.129",
    "updateAvailable": true,
    "severity": "CRITICAL",
    "status": "PENDING",
    "lastChecked": "2024-01-01T00:00:00.000Z",
    "assetId": "asset_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Scan for Patches
```http
POST /api/assets/{assetId}/patches
```

This endpoint runs the Windows winget detection script and returns discovered patches.

**Response:**
```json
{
  "success": true,
  "patches": [
    {
      "name": "Google Chrome",
      "currentVersion": "120.0.6099.109",
      "latestVersion": "120.0.6099.129",
      "updateAvailable": true,
      "severity": "CRITICAL",
      "status": "PENDING"
    }
  ],
  "message": "Successfully scanned for patches"
}
```

#### Update Patch Status
```http
PUT /api/patches/{id}
```

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Available Status Values:**
- `PENDING` - Newly discovered patch
- `APPROVED` - Patch approved for installation
- `INSTALLED` - Patch successfully installed
- `FAILED` - Patch installation failed
- `IGNORED` - Patch marked as not applicable

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": "Field 'name' is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Asset not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Limits are:
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Example:**
```http
GET /api/assets?page=2&limit=10
```

## Filtering and Sorting

Some endpoints support filtering and sorting:

**Filtering:**
```http
GET /api/assets?osType=Windows&status=active
```

**Sorting:**
```http
GET /api/assets?sort=name&order=asc
```

## Webhooks

The system supports webhooks for real-time notifications:

```http
POST /webhooks/patch-updates
```

**Webhook Payload:**
```json
{
  "event": "patch.discovered",
  "asset": {
    "id": "asset_id",
    "name": "Server-01"
  },
  "patch": {
    "name": "Google Chrome",
    "severity": "CRITICAL",
    "currentVersion": "120.0.6099.109",
    "latestVersion": "120.0.6099.129"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

// Get all assets
const assets = await api.get('/assets');

// Create new asset
const newAsset = await api.post('/assets', {
  name: 'Server-01',
  description: 'Production server',
  ipAddress: '192.168.1.100',
  osType: 'Windows Server 2022'
});

// Scan for patches
const patches = await api.post(`/assets/${assetId}/patches`);
```

### Python
```python
import requests

base_url = 'http://localhost:3000/api'

# Get all assets
response = requests.get(f'{base_url}/assets')
assets = response.json()

# Create new asset
asset_data = {
    'name': 'Server-01',
    'description': 'Production server',
    'ipAddress': '192.168.1.100',
    'osType': 'Windows Server 2022'
}
response = requests.post(f'{base_url}/assets', json=asset_data)
```

### cURL
```bash
# Get all assets
curl -X GET http://localhost:3000/api/assets

# Create new asset
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server-01",
    "description": "Production server",
    "ipAddress": "192.168.1.100",
    "osType": "Windows Server 2022"
  }'

# Scan for patches
curl -X POST http://localhost:3000/api/assets/asset_id/patches
```

