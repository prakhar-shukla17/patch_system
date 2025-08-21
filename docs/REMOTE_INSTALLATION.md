# Remote Installation System

This document explains how to set up and use the remote installation system for deploying updates across multiple systems.

## Overview

The remote installation system allows you to install software updates on remote systems without having the installation scripts on those systems. It uses a client-server architecture with installation agents running on target systems.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Backend Server │    │ Remote Agents   │
│                 │    │                 │    │                 │
│ - View patches  │───▶│ - Manage agents │───▶│ - Execute       │
│ - Trigger       │    │ - Send commands │    │   installations │
│   installations │    │ - Track status  │    │ - Report status │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Backend Setup

The backend already includes the remote installation service. Make sure to install the required dependencies:

```bash
cd backend
npm install
```

### 2. Deploy Remote Agents

#### Option A: Python Agent (Recommended)

1. **Copy the agent script** to the target system:
   ```bash
   scp scripts/remote_agent.py user@target-system:/tmp/
   scp scripts/requirements.txt user@target-system:/tmp/
   scp scripts/test_agent.py user@target-system:/tmp/
   ```

2. **Install dependencies** on the target system:
   ```bash
   ssh user@target-system
   cd /tmp
   pip install -r requirements.txt
   ```

3. **Test the connection** (recommended):
   ```bash
   python test_agent.py <agent_id> <api_key> <server_url>
   ```

   **Example:**
   ```bash
   python test_agent.py windows-agent-001 mysecretkey123 http://your-server:5000
   ```

4. **Run the agent**:
   ```bash
   python remote_agent.py <agent_id> <api_key> <server_url>
   ```

   **Example:**
   ```bash
   python remote_agent.py windows-agent-001 mysecretkey123 http://your-server:5000
   ```

#### Option B: Bash Agent (Simple)

For systems without Python, you can use the bash script:

```bash
# Copy and run the bash agent
curl -O https://your-server.com/agent.sh
chmod +x agent.sh
./agent.sh <agent_id> <api_key> <server_url>
```

### 3. Register Agents

Once agents are running, register them with the backend:

```bash
curl -X POST http://localhost:5000/api/patches/agents/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "windows-agent-001",
    "url": "http://target-system:8080",
    "apiKey": "mysecretkey123",
    "system": "WINDOWS",
    "capabilities": ["WINGET", "CHOCOLATEY", "MANUAL"]
  }'
```

## Supported Systems

### Windows
- **Winget**: Native Windows package manager
- **Chocolatey**: Third-party package manager
- **Manual**: Download and install from URL

### Linux
- **APT**: Debian/Ubuntu package manager
- **Brew**: Homebrew for Linux
- **Manual**: Download and install from URL

### macOS
- **Brew**: Homebrew package manager
- **Manual**: Download and install from URL

## Usage

### 1. View Available Agents

```bash
curl -X GET http://localhost:5000/api/patches/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Install Update Remotely

```bash
curl -X POST http://localhost:5000/api/patches/PATCH_ID/install-remote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "windows-agent-001"
  }'
```

### 3. Generate Installation Script

```bash
curl -X GET "http://localhost:5000/api/patches/PATCH_ID/installation-script?system=WINDOWS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

### 1. API Keys
- Use strong, unique API keys for each agent
- Rotate keys regularly
- Store keys securely

### 2. Network Security
- Use HTTPS for all communications
- Implement firewall rules to restrict access
- Use VPN for remote connections

### 3. Agent Security
- Run agents with minimal privileges
- Monitor agent logs for suspicious activity
- Implement agent authentication

## Troubleshooting

### Agent Not Connecting
1. Check network connectivity
2. Verify API key is correct
3. Ensure server URL is accessible
4. Check firewall settings

### Agent Getting 404 Errors
If you see "Failed to send status: 404" errors:
1. **Restart the backend server** to load the new agent routes
2. **Verify the server URL** is correct (should be `http://localhost:5000` for local testing)
3. **Check server logs** for any startup errors
4. **Test connectivity** using the test script first:
   ```bash
   python test_agent.py <agent_id> <api_key> <server_url>
   ```

### Installation Failures
1. Verify target system has required package managers
2. Check agent logs for detailed error messages
3. Ensure sufficient disk space
4. Verify user permissions

### Performance Issues
1. Monitor network latency
2. Check server resources
3. Optimize agent polling intervals
4. Use local package mirrors

## Monitoring

### Agent Status
- Online/Offline status
- Last seen timestamp
- System capabilities
- Installation history

### Installation Logs
- Success/failure rates
- Installation times
- Error messages
- System compatibility

## Advanced Configuration

### Custom Installation Scripts
You can create custom installation scripts for specific applications:

```javascript
// In the patch record
{
  "remoteInstallation": {
    "installationScript": "custom_install.sh",
    "installationMethod": "CUSTOM"
  }
}
```

### Agent Groups
Group agents by location, department, or system type:

```javascript
{
  "agentId": "windows-agent-001",
  "group": "development",
  "location": "office-1"
}
```

### Scheduled Installations
Schedule installations during maintenance windows:

```javascript
{
  "scheduledAt": "2024-01-15T02:00:00Z",
  "timezone": "UTC"
}
```

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Review agent output
3. Verify network connectivity
4. Contact system administrator
