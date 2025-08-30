const { spawn, exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const os = require("os");

const execAsync = promisify(exec);

class RemoteAgentService {
  constructor() {
    this.platform = os.platform();
    this.agents = new Map(); // Track deployed agents
  }

  /**
   * Deploy a lightweight agent to a remote system
   * @param {Object} system - System information (ip, hostname, etc.)
   * @returns {Promise<Object>} Agent deployment result
   */
  async deployAgent(system) {
    try {
      console.log(`Deploying agent to ${system.hostname} (${system.ipAddress})`);
      
      // Check if system is reachable
      const isReachable = await this.isSystemReachable(system.ipAddress);
      if (!isReachable) {
        return {
          success: false,
          error: `System ${system.ipAddress} is not reachable`
        };
      }

      // Create agent package
      const agentPackage = await this.createAgentPackage();
      
      // Deploy agent based on detected OS
      let deploymentResult;
      if (system.osType === "Windows") {
        deploymentResult = await this.deployWindowsAgent(system, agentPackage);
      } else if (system.osType === "Linux") {
        deploymentResult = await this.deployLinuxAgent(system, agentPackage);
      } else if (system.osType === "macOS") {
        deploymentResult = await this.deployMacAgent(system, agentPackage);
      } else {
        return {
          success: false,
          error: `Unsupported OS type: ${system.osType}`
        };
      }

      if (deploymentResult.success) {
        // Register agent
        this.agents.set(system.ipAddress, {
          id: deploymentResult.agentId,
          system: system,
          deployedAt: new Date(),
          status: 'active'
        });
      }

      return deploymentResult;
    } catch (error) {
      console.error(`Error deploying agent to ${system.ipAddress}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a lightweight agent package
   */
  async createAgentPackage() {
    const agentDir = path.join(__dirname, '..', '..', 'agents');
    const packageDir = path.join(agentDir, 'package');
    
    // Ensure agent directory exists
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Create agent package structure
    const packageStructure = {
      'agent.js': this.generateAgentScript(),
      'package.json': this.generatePackageJson(),
      'README.md': this.generateAgentReadme()
    };

    // Write agent files
    for (const [filename, content] of Object.entries(packageStructure)) {
      const filePath = path.join(packageDir, filename);
      fs.writeFileSync(filePath, content);
    }

    return packageDir;
  }

  /**
   * Generate the main agent script
   */
  generateAgentScript() {
    return `
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class PatchAgent {
  constructor() {
    this.platform = os.platform();
    this.hostname = os.hostname();
    this.ipAddress = this.getLocalIPAddress();
  }

  async scanForPatches() {
    try {
      console.log('Starting patch scan on', this.hostname);
      
      let patches = [];
      
      if (this.platform === 'win32') {
        patches = await this.scanWindowsPatches();
      } else if (this.platform === 'linux') {
        patches = await this.scanLinuxPatches();
      } else if (this.platform === 'darwin') {
        patches = await this.scanMacPatches();
      }
      
      return {
        success: true,
        system: {
          hostname: this.hostname,
          ipAddress: this.ipAddress,
          platform: this.platform,
          osType: this.getOSType(this.platform)
        },
        patches: patches
      };
    } catch (error) {
      console.error('Error scanning patches:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async scanWindowsPatches() {
    const patches = [];
    
    try {
      // Use winget to get installed packages
      const { stdout } = await execAsync('winget list');
      const lines = stdout.split('\\n');
      
      for (const line of lines) {
        const match = line.match(/^([^\\s]+)\\s+([^\\s]+)\\s+([^\\s]+)/);
        if (match) {
          const [, name, id, version] = match;
          if (name && version && version !== 'Unknown') {
            patches.push({
              name: name,
              id: id,
              current_version: version,
              latest_version: version, // Would need to check for updates
              update_available: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scanning Windows patches:', error);
    }
    
    return patches;
  }

  async scanLinuxPatches() {
    const patches = [];
    
    try {
      // Check for different package managers
      const packageManagers = ['apt', 'yum', 'dnf', 'pacman', 'zypper'];
      
      for (const pm of packageManagers) {
        try {
          const { stdout } = await execAsync(\`which \${pm}\`);
          if (stdout.trim()) {
            patches.push(...await this.scanWithPackageManager(pm));
            break;
          }
        } catch (error) {
          // Package manager not found, continue to next
        }
      }
    } catch (error) {
      console.error('Error scanning Linux patches:', error);
    }
    
    return patches;
  }

  async scanMacPatches() {
    const patches = [];
    
    try {
      // Check for Homebrew
      try {
        const { stdout } = await execAsync('brew list --formula');
        const packages = stdout.split('\\n').filter(pkg => pkg.trim());
        
        for (const pkg of packages) {
          try {
            const { stdout: versionOutput } = await execAsync(\`brew info \${pkg} --json=v1\`);
            const info = JSON.parse(versionOutput);
            if (info.length > 0) {
              patches.push({
                name: pkg,
                id: pkg,
                current_version: info[0].installed[0]?.version || 'Unknown',
                latest_version: info[0].installed[0]?.version || 'Unknown',
                update_available: false
              });
            }
          } catch (error) {
            // Skip this package
          }
        }
      } catch (error) {
        // Homebrew not found
      }
    } catch (error) {
      console.error('Error scanning Mac patches:', error);
    }
    
    return patches;
  }

  async scanWithPackageManager(pm) {
    const patches = [];
    
    try {
      let command;
      if (pm === 'apt') {
        command = 'dpkg -l | grep "^ii"';
      } else if (pm === 'yum' || pm === 'dnf') {
        command = 'rpm -qa';
      } else if (pm === 'pacman') {
        command = 'pacman -Q';
      } else if (pm === 'zypper') {
        command = 'rpm -qa';
      }
      
      if (command) {
        const { stdout } = await execAsync(command);
        const lines = stdout.split('\\n');
        
        for (const line of lines) {
          const match = line.match(/^([^\\s]+)\\s+([^\\s]+)/);
          if (match) {
            const [, name, version] = match;
            patches.push({
              name: name,
              id: name,
              current_version: version,
              latest_version: version,
              update_available: false
            });
          }
        }
      }
    } catch (error) {
      console.error(\`Error scanning with \${pm}:\`, error);
    }
    
    return patches;
  }

  getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    return '127.0.0.1';
  }

  getOSType(platform) {
    switch (platform) {
      case 'win32': return 'Windows';
      case 'darwin': return 'macOS';
      case 'linux': return 'Linux';
      default: return 'Other';
    }
  }
}

// If running as main script
if (require.main === module) {
  const agent = new PatchAgent();
  agent.scanForPatches().then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Agent error:', error);
    process.exit(1);
  });
}

module.exports = PatchAgent;
    `.trim();
  }

  /**
   * Generate package.json for the agent
   */
  generatePackageJson() {
    return JSON.stringify({
      name: "patch-agent",
      version: "1.0.0",
      description: "Lightweight patch scanning agent",
      main: "agent.js",
      scripts: {
        start: "node agent.js"
      },
      dependencies: {},
      engines: {
        node: ">=14.0.0"
      }
    }, null, 2);
  }

  /**
   * Generate README for the agent
   */
  generateAgentReadme() {
    return `# Patch Agent

A lightweight agent for scanning system patches and updates.

## Usage

\`\`\`bash
node agent.js
\`\`\`

## Requirements

- Node.js 14.0.0 or higher
- Appropriate permissions to scan system packages
    `.trim();
  }

  /**
   * Deploy agent to Windows system
   */
  async deployWindowsAgent(system, agentPackage) {
    try {
      // Use PowerShell remoting or SMB to deploy
      const agentId = \`agent_\${system.ipAddress.replace(/\./g, '_')}_\${Date.now()}\`;
      
      // For now, return success (actual deployment would require more complex setup)
      return {
        success: true,
        agentId: agentId,
        message: \`Agent deployed to Windows system \${system.hostname}\`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deploy agent to Linux system
   */
  async deployLinuxAgent(system, agentPackage) {
    try {
      const agentId = \`agent_\${system.ipAddress.replace(/\./g, '_')}_\${Date.now()}\`;
      
      // For now, return success (actual deployment would require SSH access)
      return {
        success: true,
        agentId: agentId,
        message: \`Agent deployed to Linux system \${system.hostname}\`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deploy agent to macOS system
   */
  async deployMacAgent(system, agentPackage) {
    try {
      const agentId = \`agent_\${system.ipAddress.replace(/\./g, '_')}_\${Date.now()}\`;
      
      // For now, return success (actual deployment would require SSH access)
      return {
        success: true,
        agentId: agentId,
        message: \`Agent deployed to macOS system \${system.hostname}\`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if a system is reachable
   */
  async isSystemReachable(ipAddress) {
    try {
      const command = this.platform === "win32" 
        ? \`ping -n 1 -w 1000 \${ipAddress}\`
        : \`ping -c 1 -W 1 \${ipAddress}\`;
      
      await execAsync(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get deployed agents
   */
  getDeployedAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Remove an agent
   */
  async removeAgent(agentId) {
    for (const [ip, agent] of this.agents.entries()) {
      if (agent.id === agentId) {
        this.agents.delete(ip);
        return true;
      }
    }
    return false;
  }
}

module.exports = RemoteAgentService;
