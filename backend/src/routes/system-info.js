const express = require("express");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");
const { protect } = require("../middleware/auth");

const execAsync = promisify(exec);
const router = express.Router();

// Apply authentication middleware
router.use(protect);

// @desc    Get system information
// @route   GET /api/system-info
// @access  Private
router.get("/", async (req, res) => {
  try {
    console.log("=== System Info Request ===");
    console.log("Hostname:", os.hostname());
    console.log("Platform:", os.platform());
    console.log("OS Type:", getOSType(os.platform()));
    console.log("IP Address:", getLocalIPAddress());

    const macAddress = await getMACAddress();
    console.log("MAC Address:", macAddress);

    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      osType: getOSType(os.platform()),
      ipAddress: getLocalIPAddress(),
      macAddress: macAddress,
      architecture: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      uptime: os.uptime(),
    };

    console.log("Final system info:", systemInfo);
    console.log("=== End System Info Request ===");

    res.json({
      success: true,
      data: systemInfo,
    });
  } catch (error) {
    console.error("Get system info error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Test MAC address detection
// @route   GET /api/system-info/test-mac
// @access  Private
router.get("/test-mac", async (req, res) => {
  try {
    console.log("=== MAC Address Test ===");
    const macAddress = await getMACAddress();
    console.log("MAC Address Result:", macAddress);
    console.log("=== End MAC Address Test ===");

    res.json({
      success: true,
      macAddress: macAddress,
      platform: os.platform(),
      interfaces: os.networkInterfaces(),
    });
  } catch (error) {
    console.error("MAC address test error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

function getOSType(platform) {
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

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();

  // Look for non-internal IPv4 addresses
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }

  return "127.0.0.1"; // Fallback to localhost
}

async function getMACAddress() {
  try {
    const platform = os.platform();
    console.log("Platform:", platform);

    if (platform === "win32") {
      // Windows - try multiple methods
      try {
        // Method 1: getmac command
        const { stdout } = await execAsync("getmac /fo csv /nh");
        console.log("Windows getmac output:", stdout);
        const lines = stdout.trim().split("\n");
        if (lines.length > 0) {
          const macMatch = lines[0].match(
            /"([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}"/
          );
          if (macMatch) {
            return macMatch[0].replace(/"/g, "");
          }
        }
      } catch (error) {
        console.log("Windows getmac failed, trying ipconfig...");
      }

      try {
        // Method 2: ipconfig command
        const { stdout } = await execAsync("ipconfig /all");
        const macMatch = stdout.match(
          /Physical Address[.\s]*: ([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/i
        );
        if (macMatch) {
          return macMatch[1];
        }
      } catch (error) {
        console.log("Windows ipconfig failed");
      }
    } else if (platform === "darwin") {
      // macOS - try multiple interfaces
      const interfaces = ["en0", "en1", "en2", "en3"];
      for (const iface of interfaces) {
        try {
          const { stdout } = await execAsync(`ifconfig ${iface} | grep ether`);
          console.log(`macOS ${iface} output:`, stdout);
          const macMatch = stdout.match(
            /ether\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i
          );
          if (macMatch) {
            return macMatch[1];
          }
        } catch (error) {
          console.log(`macOS ${iface} failed`);
        }
      }
    } else if (platform === "linux") {
      // Linux - try multiple methods
      try {
        // Method 1: ip link show
        const { stdout } = await execAsync(
          "ip link show | grep -A 1 'state UP' | grep link"
        );
        console.log("Linux ip link output:", stdout);
        const macMatch = stdout.match(
          /link\/ether\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i
        );
        if (macMatch) {
          return macMatch[1];
        }
      } catch (error) {
        console.log("Linux ip link failed, trying ifconfig...");
      }

      try {
        // Method 2: ifconfig
        const { stdout } = await execAsync("ifconfig | grep -E 'ether|HWaddr'");
        console.log("Linux ifconfig output:", stdout);
        const macMatch = stdout.match(
          /(?:ether|HWaddr)\s+([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i
        );
        if (macMatch) {
          return macMatch[1];
        }
      } catch (error) {
        console.log("Linux ifconfig failed");
      }
    }

    // Fallback: try to get from Node.js network interfaces
    console.log("Trying Node.js network interfaces fallback...");
    const interfaces = os.networkInterfaces();
    console.log("Available interfaces:", Object.keys(interfaces));

    for (const name of Object.keys(interfaces)) {
      for (const interface of interfaces[name]) {
        console.log(`Interface ${name}:`, interface);
        if (
          interface.family === "IPv4" &&
          !interface.internal &&
          interface.mac
        ) {
          console.log("Found MAC address:", interface.mac);
          return interface.mac;
        }
      }
    }

    console.log("No MAC address found, returning Unknown");
    return "Unknown";
  } catch (error) {
    console.error("Error getting MAC address:", error);
    return "Unknown";
  }
}

module.exports = router;
