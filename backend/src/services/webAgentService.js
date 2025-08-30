const express = require("express");
const { exec } = require("child_process");
const { promisify } = require("util");
const os = require("os");
const path = require("path");

const execAsync = promisify(exec);

class WebAgentService {
  constructor() {
    this.platform = os.platform();
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        platform: this.platform,
        hostname: os.hostname(),
        timestamp: new Date().toISOString(),
      });
    });

    // System info endpoint
    this.app.get("/system-info", (req, res) => {
      res.json({
        hostname: os.hostname(),
        platform: this.platform,
        osType: this.getOSType(this.platform),
        ipAddress: this.getLocalIPAddress(),
        macAddress: this.getMACAddress(),
        architecture: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length,
        uptime: os.uptime(),
      });
    });

    // Scan patches endpoint
    this.app.get("/scan-patches", async (req, res) => {
      try {
        const patches = await this.scanForPatches();
        res.json({
          success: true,
          system: {
            hostname: os.hostname(),
            ipAddress: this.getLocalIPAddress(),
            platform: this.platform,
            osType: this.getOSType(this.platform),
          },
          patches: patches,
          scannedAt: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Install update endpoint
    this.app.post("/install-update", async (req, res) => {
      try {
        const { appId, appName } = req.body;

        if (!appId && !appName) {
          return res.status(400).json({
            success: false,
            error: "appId or appName is required",
          });
        }

        const result = await this.installUpdate(appId || appName);
        res.json({
          success: true,
          result: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  }

  async scanForPatches() {
    try {
      console.log("Starting patch scan on", os.hostname());

      let patches = [];

      if (this.platform === "win32") {
        patches = await this.scanWindowsPatches();
      } else if (this.platform === "linux") {
        patches = await this.scanLinuxPatches();
      } else if (this.platform === "darwin") {
        patches = await this.scanMacPatches();
      }

      return patches;
    } catch (error) {
      console.error("Error scanning patches:", error);
      throw error;
    }
  }

  async scanWindowsPatches() {
    const patches = [];

    try {
      // Use winget to get installed packages
      const { stdout } = await execAsync("winget list");
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(/^([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
        if (match) {
          const [, name, id, version] = match;
          if (name && version && version !== "Unknown") {
            patches.push({
              name: name,
              id: id,
              current_version: version,
              latest_version: version, // Would need to check for updates
              update_available: false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error scanning Windows patches:", error);
    }

    return patches;
  }

  async scanLinuxPatches() {
    const patches = [];

    try {
      // Check for different package managers
      const packageManagers = ["apt", "yum", "dnf", "pacman", "zypper"];

      for (const pm of packageManagers) {
        try {
          const { stdout } = await execAsync(`which ${pm}`);
          if (stdout.trim()) {
            patches.push(...(await this.scanWithPackageManager(pm)));
            break;
          }
        } catch (error) {
          // Package manager not found, continue to next
        }
      }
    } catch (error) {
      console.error("Error scanning Linux patches:", error);
    }

    return patches;
  }

  async scanMacPatches() {
    const patches = [];

    try {
      // Check for Homebrew
      try {
        const { stdout } = await execAsync("brew list --formula");
        const packages = stdout.split("\n").filter((pkg) => pkg.trim());

        for (const pkg of packages) {
          try {
            const { stdout: versionOutput } = await execAsync(
              `brew info ${pkg} --json=v1`
            );
            const info = JSON.parse(versionOutput);
            if (info.length > 0) {
              patches.push({
                name: pkg,
                id: pkg,
                current_version: info[0].installed[0]?.version || "Unknown",
                latest_version: info[0].installed[0]?.version || "Unknown",
                update_available: false,
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
      console.error("Error scanning Mac patches:", error);
    }

    return patches;
  }

  async scanWithPackageManager(pm) {
    const patches = [];

    try {
      let command;
      if (pm === "apt") {
        command = 'dpkg -l | grep "^ii"';
      } else if (pm === "yum" || pm === "dnf") {
        command = "rpm -qa";
      } else if (pm === "pacman") {
        command = "pacman -Q";
      } else if (pm === "zypper") {
        command = "rpm -qa";
      }

      if (command) {
        const { stdout } = await execAsync(command);
        const lines = stdout.split("\n");

        for (const line of lines) {
          const match = line.match(/^([^\s]+)\s+([^\s]+)/);
          if (match) {
            const [, name, version] = match;
            patches.push({
              name: name,
              id: name,
              current_version: version,
              latest_version: version,
              update_available: false,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning with ${pm}:`, error);
    }

    return patches;
  }

  async installUpdate(appId) {
    try {
      if (this.platform === "win32") {
        // Use winget to install/update
        const { stdout } = await execAsync(`winget install ${appId}`);
        return {
          success: true,
          output: stdout,
          method: "winget",
        };
      } else if (this.platform === "linux") {
        // Try different package managers
        const packageManagers = ["apt", "yum", "dnf", "pacman", "zypper"];

        for (const pm of packageManagers) {
          try {
            const { stdout } = await execAsync(`which ${pm}`);
            if (stdout.trim()) {
              let command;
              if (pm === "apt") {
                command = `apt update && apt install -y ${appId}`;
              } else if (pm === "yum" || pm === "dnf") {
                command = `${pm} install -y ${appId}`;
              } else if (pm === "pacman") {
                command = `pacman -S --noconfirm ${appId}`;
              } else if (pm === "zypper") {
                command = `zypper install -y ${appId}`;
              }

              if (command) {
                const { stdout: installOutput } = await execAsync(command);
                return {
                  success: true,
                  output: installOutput,
                  method: pm,
                };
              }
            }
          } catch (error) {
            // Continue to next package manager
          }
        }
      } else if (this.platform === "darwin") {
        // Use Homebrew
        try {
          const { stdout } = await execAsync(`brew install ${appId}`);
          return {
            success: true,
            output: stdout,
            method: "homebrew",
          };
        } catch (error) {
          throw new Error(`Failed to install with Homebrew: ${error.message}`);
        }
      }

      throw new Error("Unsupported platform for installation");
    } catch (error) {
      console.error("Error installing update:", error);
      throw error;
    }
  }

  getLocalIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }

    return "127.0.0.1";
  }

  getMACAddress() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal && iface.mac) {
          return iface.mac;
        }
      }
    }

    return "Unknown";
  }

  getOSType(platform) {
    switch (platform) {
      case "win32":
        return "Windows";
      case "darwin":
        return "macOS";
      case "linux":
        return "Linux";
      default:
        return "Other";
    }
  }

  start(port = 3001) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Web agent started on port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`System info: http://localhost:${port}/system-info`);
        console.log(`Scan patches: http://localhost:${port}/scan-patches`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log("Web agent stopped");
    }
  }
}

module.exports = WebAgentService;
