# Patch Management System - Deployment Guide

## Overview

This guide explains how to deploy the patch management system on a server and set up remote agents for scanning systems that don't have the Python scripts folder.

## Architecture

The system uses a **server-client architecture**:

- **Server**: Hosts the main application and manages all discovered systems
- **Agents**: Lightweight web services running on remote systems to scan for patches

## Deployment Options

### Option 1: Server-Only Deployment (Current Limitation)

**Problem**: When hosted on a server, the system can only scan the server itself, not remote systems.

**Why it doesn't work for remote systems**:
- Python scripts (`latest_version.py`, etc.) are located on the server
- Patch scanning runs on the server, not on discovered remote systems
- Remote systems don't have access to the required scripts

**Current behavior**:
```javascript
// This runs on the SERVER, scanning server's applications
const patchInfo = await patchService.getInstalledApps();
```

### Option 2: Agent-Based Deployment (Recommended)

**Solution**: Deploy lightweight agents on remote systems that can scan their own applications.

## Agent-Based Deployment

### Step 1: Deploy the Main Server

1. **Clone the repository on your server**:
   ```bash
   git clone <repository-url>
   cd patch-system
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your database and other settings
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Step 2: Deploy Agents on Remote Systems

#### Method A: Manual Agent Deployment

1. **On each remote system, install Node.js** (version 14 or higher)

2. **Copy the agent files**:
   ```bash
   # Create agent directory
   mkdir patch-agent
   cd patch-agent
   
   # Copy the agent startup script
   # (You'll need to copy start_agent.js and the backend folder)
   ```

3. **Install agent dependencies**:
   ```bash
   npm install express
   ```

4. **Start the agent**:
   ```bash
   node start_agent.js
   ```

#### Method B: Automated Agent Deployment

Create a deployment script that automatically installs agents on discovered systems:

```bash
#!/bin/bash
# deploy_agent.sh

REMOTE_IP=$1
REMOTE_USER=$2

if [ -z "$REMOTE_IP" ] || [ -z "$REMOTE_USER" ]; then
    echo "Usage: $0 <remote_ip> <remote_user>"
    exit 1
fi

echo "Deploying agent to $REMOTE_IP..."

# Copy agent files to remote system
scp -r agent-package $REMOTE_USER@$REMOTE_IP:/tmp/

# Install and start agent on remote system
ssh $REMOTE_USER@$REMOTE_IP << 'EOF'
    cd /tmp/agent-package
    npm install
    nohup node start_agent.js > agent.log 2>&1 &
    echo "Agent started on port 6001"
EOF
```

### Step 3: Agent Configuration

#### Agent Port Configuration

Agents run on different ports to avoid conflicts:

```bash
# Set custom port (optional)
export AGENT_PORT=6001
node start_agent.js
```

#### Agent Security

For production use, add authentication to agents:

```javascript
// In webAgentService.js
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.AGENT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### Step 4: Test the Setup

1. **Start the main server**
2. **Start agents on remote systems**
3. **Run network discovery**:
   - Go to the dashboard
   - Click "Scan All Local Systems"
   - The system will discover remote systems and scan them via agents

## Agent Endpoints

Each agent provides these HTTP endpoints:

- `GET /health` - Health check
- `GET /system-info` - System information
- `GET /scan-patches` - Scan for patches
- `POST /install-update` - Install updates

## Troubleshooting

### Common Issues

1. **Agent not found**:
   ```
   Error: No patch agent found on 192.168.1.100
   ```
   **Solution**: Install and start the agent on the remote system

2. **Connection refused**:
   ```
   Error: connect ECONNREFUSED 192.168.1.100:3001
   ```
   **Solution**: Check if the agent is running and firewall settings

3. **Permission denied**:
   ```
   Error: EACCES: permission denied
   ```
   **Solution**: Run the agent with appropriate permissions

### Debug Commands

1. **Test agent connectivity**:
   ```bash
   curl http://192.168.1.100:3001/health
   ```

2. **Test patch scanning**:
   ```bash
   curl http://192.168.1.100:3001/scan-patches
   ```

3. **Check agent logs**:
   ```bash
   tail -f agent.log
   ```

## Production Deployment

### Using PM2 for Agent Management

Install PM2 on remote systems for better process management:

```bash
# Install PM2
npm install -g pm2

# Start agent with PM2
pm2 start start_agent.js --name "patch-agent"

# Enable auto-restart
pm2 startup
pm2 save
```

### Using Docker for Agents

Create a Dockerfile for agents:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "start_agent.js"]
```

Build and run:
```bash
docker build -t patch-agent .
docker run -d -p 3001:3001 --name patch-agent patch-agent
```

### Using Systemd for Agent Management

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
ExecStart=/usr/bin/node start_agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable patch-agent
sudo systemctl start patch-agent
```

## Security Considerations

1. **Network Security**:
   - Use HTTPS for agent communication
   - Implement API key authentication
   - Restrict agent access to trusted networks

2. **Agent Security**:
   - Run agents with minimal privileges
   - Regularly update agent software
   - Monitor agent logs for suspicious activity

3. **Server Security**:
   - Use strong authentication
   - Implement rate limiting
   - Regular security updates

## Monitoring and Maintenance

### Agent Monitoring

1. **Health Checks**: Regular health check endpoints
2. **Log Monitoring**: Monitor agent logs for errors
3. **Performance Monitoring**: Track scan times and resource usage

### Backup and Recovery

1. **Database Backups**: Regular database backups
2. **Configuration Backups**: Backup agent configurations
3. **Disaster Recovery**: Document recovery procedures

## Scaling Considerations

### Horizontal Scaling

1. **Multiple Servers**: Deploy multiple server instances
2. **Load Balancing**: Use load balancers for high availability
3. **Database Clustering**: Use database clusters for large deployments

### Agent Scaling

1. **Agent Pools**: Deploy multiple agents per system for redundancy
2. **Agent Discovery**: Implement automatic agent discovery
3. **Agent Load Balancing**: Distribute scan load across agents

## Conclusion

The agent-based architecture solves the limitation of server-only deployment by:

1. **Enabling remote scanning**: Agents can scan their own systems
2. **No script dependencies**: Agents don't need the Python scripts folder
3. **Scalable architecture**: Easy to add new systems
4. **Flexible deployment**: Multiple deployment options available

This approach allows the patch management system to work effectively in server-hosted environments while maintaining the ability to scan all locally connected systems.
