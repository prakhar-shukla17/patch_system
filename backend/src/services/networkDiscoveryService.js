const { spawn, exec } = require("child_process");
const { promisify } = require("util");
const os = require("os");

const execAsync = promisify(exec);

class NetworkDiscoveryService {
  constructor() {
    this.platform = os.platform();
  }

  /**
   * Discover locally connected systems on the network
   * @returns {Promise<Array>} Array of discovered systems with IP, MAC, and hostname
   */
  async discoverLocalSystems() {
    try {
      const localIP = this.getLocalIPAddress();
      const networkPrefix = this.getNetworkPrefix(localIP);

      console.log(`Discovering systems on network: ${networkPrefix}*`);

      let discoveredSystems = [];

      if (this.platform === "win32") {
        discoveredSystems = await this.discoverWindowsSystems(networkPrefix);
      } else if (this.platform === "linux") {
        discoveredSystems = await this.discoverLinuxSystems(networkPrefix);
      } else if (this.platform === "darwin") {
        discoveredSystems = await this.discoverMacSystems(networkPrefix);
      } else {
        console.log("Unsupported platform for network discovery");
        return [];
      }

      // Add the current system to the list
      const currentSystem = {
        ipAddress: localIP,
        macAddress: await this.getMACAddress(),
        hostname: os.hostname(),
        platform: this.platform,
        osType: this.getOSType(this.platform),
        isCurrentSystem: true,
      };

      discoveredSystems.push(currentSystem);

      console.log(`Discovered ${discoveredSystems.length} systems`);
      return discoveredSystems;
    } catch (error) {
      console.error("Error discovering local systems:", error);
      return [];
    }
  }

  /**
   * Discover systems on Windows using arp and ping
   */
  async discoverWindowsSystems(networkPrefix) {
    const systems = [];

    try {
      // First, ping the broadcast address to populate ARP table
      await execAsync(`ping -n 1 -w 1000 ${networkPrefix}255`);

      // Get ARP table
      const { stdout } = await execAsync("arp -a");
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(
          /(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f-]+)\s+dynamic/i
        );
        if (match) {
          const [, ipAddress, macAddress] = match;

          // Skip broadcast and multicast addresses
          if (ipAddress.endsWith(".255") || ipAddress.endsWith(".0")) {
            continue;
          }

          // Try to get hostname
          let hostname = "Unknown";
          try {
            const { stdout: hostnameOutput } = await execAsync(
              `nbtstat -A ${ipAddress}`
            );
            const hostnameMatch = hostnameOutput.match(
              /<00>\s+UNIQUE\s+([^\s]+)/
            );
            if (hostnameMatch) {
              hostname = hostnameMatch[1];
            }
          } catch (error) {
            // Hostname resolution failed, use IP as fallback
            hostname = ipAddress;
          }

          systems.push({
            ipAddress,
            macAddress: macAddress.replace(/-/g, ":"),
            hostname,
            platform: "Unknown",
            osType: "Unknown",
            isCurrentSystem: false,
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Windows systems:", error);
    }

    return systems;
  }

  /**
   * Discover systems on Linux using arp and ping
   */
  async discoverLinuxSystems(networkPrefix) {
    const systems = [];

    try {
      // First, ping the broadcast address to populate ARP table
      await execAsync(`ping -c 1 -W 1 ${networkPrefix}255`);

      // Get ARP table
      const { stdout } = await execAsync("arp -n");
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(
          /(\d+\.\d+\.\d+\.\d+)\s+ether\s+([0-9a-f:]+)/i
        );
        if (match) {
          const [, ipAddress, macAddress] = match;

          // Skip broadcast and multicast addresses
          if (ipAddress.endsWith(".255") || ipAddress.endsWith(".0")) {
            continue;
          }

          // Try to get hostname
          let hostname = "Unknown";
          try {
            const { stdout: hostnameOutput } = await execAsync(
              `host ${ipAddress}`
            );
            const hostnameMatch = hostnameOutput.match(
              /domain name pointer (.+)\./
            );
            if (hostnameMatch) {
              hostname = hostnameMatch[1];
            }
          } catch (error) {
            // Hostname resolution failed, use IP as fallback
            hostname = ipAddress;
          }

          systems.push({
            ipAddress,
            macAddress,
            hostname,
            platform: "Unknown",
            osType: "Unknown",
            isCurrentSystem: false,
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Linux systems:", error);
    }

    return systems;
  }

  /**
   * Discover systems on macOS using arp and ping
   */
  async discoverMacSystems(networkPrefix) {
    const systems = [];

    try {
      // First, ping the broadcast address to populate ARP table
      await execAsync(`ping -c 1 -W 1 ${networkPrefix}255`);

      // Get ARP table
      const { stdout } = await execAsync("arp -n");
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f:]+)/i);
        if (match) {
          const [, ipAddress, macAddress] = match;

          // Skip broadcast and multicast addresses
          if (ipAddress.endsWith(".255") || ipAddress.endsWith(".0")) {
            continue;
          }

          // Try to get hostname
          let hostname = "Unknown";
          try {
            const { stdout: hostnameOutput } = await execAsync(
              `host ${ipAddress}`
            );
            const hostnameMatch = hostnameOutput.match(
              /domain name pointer (.+)\./
            );
            if (hostnameMatch) {
              hostname = hostnameMatch[1];
            }
          } catch (error) {
            // Hostname resolution failed, use IP as fallback
            hostname = ipAddress;
          }

          systems.push({
            ipAddress,
            macAddress,
            hostname,
            platform: "Unknown",
            osType: "Unknown",
            isCurrentSystem: false,
          });
        }
      }
    } catch (error) {
      console.error("Error discovering macOS systems:", error);
    }

    return systems;
  }

  /**
   * Get local IP address
   */
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

  /**
   * Get network prefix from IP address
   */
  getNetworkPrefix(ipAddress) {
    const parts = ipAddress.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.`;
  }

  /**
   * Get MAC address of current system
   */
  async getMACAddress() {
    try {
      if (this.platform === "win32") {
        const { stdout } = await execAsync("getmac /fo csv /nh");
        const lines = stdout.trim().split("\n");
        if (lines.length > 0) {
          const macMatch = lines[0].match(
            /"([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}"/
          );
          if (macMatch) {
            return macMatch[0].replace(/"/g, "");
          }
        }
      } else if (this.platform === "darwin") {
        const interfaces = ["en0", "en1", "en2", "en3"];
        for (const iface of interfaces) {
          try {
            const { stdout } = await execAsync(
              `ifconfig ${iface} | grep ether`
            );
            const macMatch = stdout.match(
              /ether\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i
            );
            if (macMatch) {
              return macMatch[1];
            }
          } catch (error) {
            // Continue to next interface
          }
        }
      } else if (this.platform === "linux") {
        try {
          const { stdout } = await execAsync(
            "ip link show | grep -A 1 'state UP' | grep link"
          );
          const macMatch = stdout.match(
            /link\/ether\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i
          );
          if (macMatch) {
            return macMatch[1];
          }
        } catch (error) {
          // Try alternative method
        }
      }

      // Fallback to Node.js network interfaces
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === "IPv4" && !iface.internal && iface.mac) {
            return iface.mac;
          }
        }
      }

      return "Unknown";
    } catch (error) {
      console.error("Error getting MAC address:", error);
      return "Unknown";
    }
  }

  /**
   * Get OS type from platform
   */
  getOSType(platform) {
    switch (platform) {
      case "win32":
        return "Windows";
      case "darwin":
        return "macOS";
      case "linux":
        return "Linux";
      case "freebsd":
      case "openbsd":
      case "sunos":
        return "Unix";
      default:
        return "Other";
    }
  }

  /**
   * Check if a system is reachable
   */
  async isSystemReachable(ipAddress) {
    try {
      const command =
        this.platform === "win32"
          ? `ping -n 1 -w 1000 ${ipAddress}`
          : `ping -c 1 -W 1 ${ipAddress}`;

      await execAsync(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = NetworkDiscoveryService;
