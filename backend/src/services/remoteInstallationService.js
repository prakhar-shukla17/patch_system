const axios = require("axios");
const crypto = require("crypto");

class RemoteInstallationService {
  constructor() {
    this.installationAgents = new Map();
  }

  /**
   * Register a remote installation agent
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} config - Agent configuration
   */
  registerAgent(agentId, config) {
    const agent = {
      id: agentId,
      url: config.url,
      apiKey: config.apiKey,
      system: config.system, // WINDOWS, LINUX, MACOS
      capabilities: config.capabilities || [], // WINGET, CHOCOLATEY, APT, BREW, etc.
      lastSeen: new Date(),
      status: "ONLINE",
    };

    this.installationAgents.set(agentId, agent);
    console.log(`Registered installation agent: ${agentId} (${config.system})`);
    return agent;
  }

  /**
   * Get available agents for a specific system and installation method
   */
  getAvailableAgents(system, installationMethod) {
    const agents = [];
    for (const [agentId, agent] of this.installationAgents) {
      if (
        agent.system === system &&
        agent.capabilities.includes(installationMethod) &&
        agent.status === "ONLINE"
      ) {
        agents.push(agent);
      }
    }
    return agents;
  }

  /**
   * Install update remotely using an agent
   */
  async installUpdateRemotely(patch, agentId) {
    const agent = this.installationAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    console.log(
      `Sending installation request to agent ${agentId} for patch ${
        patch.name || patch.appName
      }`
    );

    // Update agent status to INSTALLING
    agent.status = "INSTALLING";
    agent.lastMessage = `Installing ${patch.name || patch.appName}`;
    agent.lastSeen = new Date();

    try {
      const appId =
        patch.wingetAppId || patch.appId || patch.name || patch.appName;
      const appName = patch.name || patch.appName;
      const installationMethod =
        patch.installationMethod ||
        patch.remoteInstallation?.installationMethod ||
        "WINGET";

      console.log(
        `Installation details: ${appName} (${appId}) via ${installationMethod}`
      );

      // Actually perform the installation using the PatchService
      const { spawn } = require("child_process");
      const path = require("path");

      // Get the path to the install_update.py script
      const scriptDir = path.join(__dirname, "../../../scripts");
      const installScriptPath = path.join(scriptDir, "install_update.py");

      console.log(`Executing installation script: ${installScriptPath}`);
      console.log(`Installing app: ${appId}`);

      // Execute the installation script
      const installProcess = spawn("python", [installScriptPath, appId], {
        cwd: scriptDir,
        shell: false,
        timeout: 300000, // 5 minutes timeout
      });

      let stdout = "";
      let stderr = "";

      installProcess.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log(`Installation output: ${data.toString()}`);
      });

      installProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error(`Installation error: ${data.toString()}`);
      });

      // Wait for installation to complete
      await new Promise((resolve, reject) => {
        installProcess.on("close", (code) => {
          if (code === 0) {
            console.log(`Installation completed successfully for ${appName}`);
            agent.status = "SUCCESS";
            agent.lastMessage = `Successfully installed ${appName}`;
            agent.lastSeen = new Date();
            resolve();
          } else {
            console.error(
              `Installation failed with code ${code} for ${appName}`
            );
            agent.status = "FAILED";
            agent.lastMessage = `Installation failed for ${appName} (code: ${code})`;
            agent.lastSeen = new Date();
            reject(new Error(`Installation failed with code ${code}`));
          }
        });

        installProcess.on("error", (error) => {
          console.error(`Installation process error for ${appName}:`, error);
          agent.status = "FAILED";
          agent.lastMessage = `Installation process error for ${appName}`;
          agent.lastSeen = new Date();
          reject(error);
        });
      });

      return {
        success: true,
        message: "Installation completed successfully",
        data: {
          agentId: agentId,
          appName: appName,
          appId: appId,
          installationMethod: installationMethod,
          status: "SUCCESS",
          output: stdout,
        },
      };
    } catch (error) {
      console.error("Remote installation error:", error);

      // Update agent status to FAILED
      agent.status = "FAILED";
      agent.lastMessage = `Installation failed: ${error.message}`;
      agent.lastSeen = new Date();

      return {
        success: false,
        error: error.message || "Failed to send installation request",
      };
    }
  }

  /**
   * Generate installation script for different systems
   */
  generateInstallationScript(patch, system) {
    const { name, wingetAppId, latestVersion, remoteInstallation } = patch;

    switch (system) {
      case "WINDOWS":
        return this.generateWindowsScript(
          name,
          wingetAppId,
          remoteInstallation
        );
      case "LINUX":
        return this.generateLinuxScript(name, wingetAppId, remoteInstallation);
      case "MACOS":
        return this.generateMacOSScript(name, wingetAppId, remoteInstallation);
      default:
        throw new Error(`Unsupported system: ${system}`);
    }
  }

  generateWindowsScript(appName, appId, remoteInstallation) {
    const { installationMethod, downloadUrl } = remoteInstallation;

    let script = `@echo off\n`;
    script += `echo Installing ${appName}...\n\n`;

    switch (installationMethod) {
      case "WINGET":
        script += `winget install --id "${appId}" --accept-source-agreements --accept-package-agreements\n`;
        break;
      case "CHOCOLATEY":
        script += `choco install "${appName}" -y\n`;
        break;
      case "MANUAL":
        if (downloadUrl) {
          script += `echo Downloading from: ${downloadUrl}\n`;
          script += `start "" "${downloadUrl}"\n`;
        }
        break;
      default:
        script += `echo Manual installation required for ${appName}\n`;
    }

    script += `echo Installation completed.\n`;
    return script;
  }

  generateLinuxScript(appName, appId, remoteInstallation) {
    const { installationMethod, downloadUrl } = remoteInstallation;

    let script = `#!/bin/bash\n`;
    script += `echo "Installing ${appName}..."\n\n`;

    switch (installationMethod) {
      case "APT":
        script += `sudo apt update\n`;
        script += `sudo apt install -y "${appName}"\n`;
        break;
      case "BREW":
        script += `brew install "${appName}"\n`;
        break;
      case "MANUAL":
        if (downloadUrl) {
          script += `echo "Downloading from: ${downloadUrl}"\n`;
          script += `wget "${downloadUrl}" -O /tmp/${appName}.deb\n`;
          script += `sudo dpkg -i /tmp/${appName}.deb\n`;
        }
        break;
      default:
        script += `echo "Manual installation required for ${appName}"\n`;
    }

    script += `echo "Installation completed."\n`;
    return script;
  }

  generateMacOSScript(appName, appId, remoteInstallation) {
    const { installationMethod, downloadUrl } = remoteInstallation;

    let script = `#!/bin/bash\n`;
    script += `echo "Installing ${appName}..."\n\n`;

    switch (installationMethod) {
      case "BREW":
        script += `brew install "${appName}"\n`;
        break;
      case "MANUAL":
        if (downloadUrl) {
          script += `echo "Downloading from: ${downloadUrl}"\n`;
          script += `curl -L "${downloadUrl}" -o /tmp/${appName}.dmg\n`;
          script += `hdiutil attach /tmp/${appName}.dmg\n`;
          script += `cp -R /Volumes/${appName}/* /Applications/\n`;
          script += `hdiutil detach /Volumes/${appName}\n`;
        }
        break;
      default:
        script += `echo "Manual installation required for ${appName}"\n`;
    }

    script += `echo "Installation completed."\n`;
    return script;
  }

  /**
   * Create a simple installation agent script for target systems
   */
  createAgentScript(agentId, apiKey, serverUrl) {
    const script = `#!/bin/bash

# Remote Installation Agent
# This script runs on the target system to receive installation commands

AGENT_ID="${agentId}"
API_KEY="${apiKey}"
SERVER_URL="${serverUrl}"

echo "Starting Remote Installation Agent..."
echo "Agent ID: $AGENT_ID"
echo "Server URL: $SERVER_URL"

# Function to send status to server
send_status() {
    curl -X POST "$SERVER_URL/api/agent/status" \\
         -H "Authorization: Bearer $API_KEY" \\
         -H "Content-Type: application/json" \\
         -d "{\\"agentId\\": \\"$AGENT_ID\\", \\"status\\": \\"$1\\", \\"message\\": \\"$2\\"}"
}

# Function to execute installation
execute_installation() {
    local payload="$1"
    local app_name=$(echo "$payload" | jq -r '.appName')
    local installation_method=$(echo "$payload" | jq -r '.installationMethod')
    local download_url=$(echo "$payload" | jq -r '.downloadUrl')
    
    echo "Installing: $app_name"
    send_status "INSTALLING" "Installing $app_name"
    
    case $installation_method in
        "WINGET")
            winget install --id "$app_name" --accept-source-agreements --accept-package-agreements
            ;;
        "CHOCOLATEY")
            choco install "$app_name" -y
            ;;
        "APT")
            sudo apt update && sudo apt install -y "$app_name"
            ;;
        "BREW")
            brew install "$app_name"
            ;;
        "MANUAL")
            if [ ! -z "$download_url" ]; then
                echo "Opening download URL: $download_url"
                if command -v xdg-open > /dev/null; then
                    xdg-open "$download_url"
                elif command -v open > /dev/null; then
                    open "$download_url"
                else
                    echo "Please download from: $download_url"
                fi
            fi
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        send_status "SUCCESS" "Successfully installed $app_name"
    else
        send_status "FAILED" "Failed to install $app_name"
    fi
}

# Start HTTP server to receive commands
while true; do
    echo "Waiting for installation commands..."
    # This is a simplified version - in production, you'd use a proper HTTP server
    sleep 30
    send_status "ONLINE" "Agent is running"
done
`;

    return script;
  }

  /**
   * Get system information for remote installation
   */
  async getSystemInfo(agentId) {
    const agent = this.installationAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    try {
      const response = await axios.get(`${agent.url}/api/system-info`, {
        headers: {
          Authorization: `Bearer ${agent.apiKey}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error(
        `Failed to get system info from agent ${agentId}:`,
        error.message
      );
      return null;
    }
  }
}

module.exports = RemoteInstallationService;
