# Patch Agent

A lightweight agent for scanning system patches and updates. This agent runs on remote systems and provides HTTP endpoints for the main patch management system to scan for patches.

## Features

- **Cross-platform support**: Windows, Linux, macOS
- **Multiple package managers**: winget, apt, yum, dnf, pacman, zypper, homebrew
- **HTTP API**: RESTful endpoints for scanning and updates
- **Lightweight**: Minimal dependencies, easy to deploy
- **Real-time scanning**: Scan for patches on demand

## Requirements

- Node.js 14.0.0 or higher
- Appropriate permissions to scan system packages
- Network access for HTTP communication

## Installation

### Quick Start

1. **Install Node.js** (if not already installed):
   ```bash
   # Windows: Download from https://nodejs.org/
   # Linux: sudo apt install nodejs npm
   # macOS: brew install node
   ```

2. **Download and extract the agent package**:
   ```bash
   # Extract to a directory
   cd patch-agent
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the agent**:
   ```bash
   npm start
   ```

### Alternative: Direct Node.js

If you prefer to run directly with Node.js:

```bash
node agent.js
```

## Configuration

### Environment Variables

- `AGENT_PORT`: Port to run the agent on (default: 3001)

Example:
```bash
export AGENT_PORT=3002
node agent.js
```

### Custom Port

You can specify a custom port when starting:

```bash
AGENT_PORT=3002 node agent.js
```

## Usage

### Starting the Agent

```bash
# Start with default port (3001)
npm start

# Start with custom port
AGENT_PORT=3002 npm start
```

### Agent Endpoints

Once started, the agent provides these HTTP endpoints:

#### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "platform": "win32",
  "hostname": "DESKTOP-ABC123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### System Information
```bash
curl http://localhost:3001/system-info
```

Response:
```json
{
  "hostname": "DESKTOP-ABC123",
  "platform": "win32",
  "osType": "Windows",
  "ipAddress": "192.168.1.100",
  "macAddress": "00:11:22:33:44:55",
  "architecture": "x64",
  "totalMemory": 8589934592,
  "freeMemory": 4294967296,
  "cpuCount": 8,
  "uptime": 3600
}
```

#### Scan for Patches
```bash
curl http://localhost:3001/scan-patches
```

Response:
```json
{
  "success": true,
  "system": {
    "hostname": "DESKTOP-ABC123",
    "ipAddress": "192.168.1.100",
    "platform": "win32",
    "osType": "Windows"
  },
  "patches": [
    {
      "name": "Google Chrome",
      "id": "Google.Chrome",
      "current_version": "120.0.6099.109",
      "latest_version": "120.0.6099.130",
      "update_available": true
    }
  ],
  "scannedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Install Update
```bash
curl -X POST http://localhost:3001/install-update \
  -H "Content-Type: application/json" \
  -d '{"appId": "Google.Chrome"}'
```

Response:
```json
{
  "success": true,
  "result": {
    "success": true,
    "output": "Installation completed successfully",
    "method": "winget"
  }
}
```

## Package Manager Support

### Windows
- **winget**: Windows Package Manager
- **chocolatey**: Chocolatey Package Manager (if installed)

### Linux
- **apt**: Debian/Ubuntu package manager
- **yum**: Red Hat/CentOS package manager
- **dnf**: Fedora package manager
- **pacman**: Arch Linux package manager
- **zypper**: openSUSE package manager

### macOS
- **homebrew**: Homebrew package manager

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   Error: EACCES: permission denied
   ```
   **Solution**: Run with appropriate permissions or use sudo (Linux/macOS)

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   **Solution**: Use a different port with `AGENT_PORT=3002`

3. **Package Manager Not Found**
   ```
   Error: which: no winget in (/usr/local/bin:/usr/bin:/bin)
   ```
   **Solution**: Install the required package manager for your system

4. **Network Access Denied**
   ```
   Error: connect ECONNREFUSED
   ```
   **Solution**: Check firewall settings and ensure the port is accessible

### Debug Mode

Enable debug logging:

```bash
DEBUG=* node agent.js
```

### Logs

The agent logs to the console. For production use, redirect output:

```bash
node agent.js > agent.log 2>&1
```

## Production Deployment

### Using PM2 (Recommended)

Install PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start agent with PM2
pm2 start agent.js --name "patch-agent"

# Enable auto-restart
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs patch-agent
```

### Using Systemd (Linux)

Create a systemd service file:

```ini
# /etc/systemd/system/patch-agent.service
[Unit]
Description=Patch Management Agent
After=network.target

[Service]
Type=simple
User=patch-agent
WorkingDirectory=/opt/patch-agent
ExecStart=/usr/bin/node agent.js
Restart=always
RestartSec=10
Environment=AGENT_PORT=3001

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable patch-agent
sudo systemctl start patch-agent
sudo systemctl status patch-agent
```

### Using Docker

Create a Dockerfile:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "agent.js"]
```

Build and run:
```bash
docker build -t patch-agent .
docker run -d -p 3001:3001 --name patch-agent patch-agent
```

## Security Considerations

1. **Network Security**:
   - The agent runs on HTTP by default
   - For production, consider using HTTPS
   - Restrict access to trusted networks

2. **Authentication**:
   - Add API key authentication for production use
   - Implement rate limiting

3. **Permissions**:
   - Run with minimal required permissions
   - Avoid running as root when possible

## Integration with Main System

The agent is designed to work with the main patch management system:

1. **Discovery**: The main system discovers systems on the network
2. **Connection**: The main system connects to agents via HTTP
3. **Scanning**: The main system requests patch scans from agents
4. **Management**: The main system manages and displays results

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all requirements are met
4. Test with the health check endpoint

## License

MIT License - see LICENSE file for details.
