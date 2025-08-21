const express = require("express");
const { body, validationResult } = require("express-validator");
const RemoteInstallationService = require("../services/remoteInstallationService");

const router = express.Router();

// Initialize remote installation service
const remoteInstallationService = new RemoteInstallationService();

// Note: These endpoints don't require JWT authentication for easier agent usage

// @desc    Update agent status (called by remote agents)
// @route   POST /api/agent/status
// @access  Private (requires API key)
router.post("/status", async (req, res) => {
  try {
    const { agentId, status, message, timestamp, system, capabilities } =
      req.body;
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    if (!agentId || !status || !apiKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId, status, or API key",
      });
    }

    // Find the agent by ID and verify API key
    let agent = remoteInstallationService.installationAgents.get(agentId);

    // If agent doesn't exist, auto-register it (for easier testing)
    if (!agent) {
      console.log(`Auto-registering agent: ${agentId}`);
      agent = remoteInstallationService.registerAgent(agentId, {
        url: `http://${req.ip}:8080`, // Default URL
        apiKey: apiKey,
        system: system || "WINDOWS",
        capabilities: capabilities || ["WINGET", "CHOCOLATEY", "MANUAL"],
      });
    } else if (agent.apiKey !== apiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid agent ID or API key",
      });
    }

    // Update agent status
    agent.status = status;
    agent.lastSeen = new Date();
    if (message) agent.lastMessage = message;
    if (system) agent.system = system;
    if (capabilities) agent.capabilities = capabilities;

    console.log(
      `Agent ${agentId} status updated: ${status} - ${message || ""}`
    );

    res.json({
      success: true,
      message: "Agent status updated successfully",
      data: {
        agentId: agent.id,
        status: agent.status,
        lastSeen: agent.lastSeen,
      },
    });
  } catch (error) {
    console.error("Agent status update error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Get system information from agent
// @route   GET /api/agent/system-info
// @access  Private (requires API key)
router.get("/system-info", async (req, res) => {
  try {
    const agentId = req.query.agentId;
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    if (!agentId || !apiKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId or API key",
      });
    }

    // Find the agent by ID and verify API key
    const agent = remoteInstallationService.installationAgents.get(agentId);
    if (!agent || agent.apiKey !== apiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid agent ID or API key",
      });
    }

    // Return basic system info
    res.json({
      success: true,
      data: {
        agentId: agent.id,
        system: agent.system,
        capabilities: agent.capabilities,
        status: agent.status,
        lastSeen: agent.lastSeen,
      },
    });
  } catch (error) {
    console.error("Get system info error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Direct installation endpoint (no JWT required)
// @route   POST /api/agent/install
// @access  Public (works with JWT token or API key)
router.post("/install", async (req, res) => {
  try {
    const { agentId, appName, appId, installationMethod, downloadUrl } =
      req.body;
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: agentId",
      });
    }

    // Find the agent by ID
    let agent = remoteInstallationService.installationAgents.get(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error:
          "Agent not found. Please ensure the agent is running and registered.",
      });
    }

    // For web interface, we don't require API key verification
    // The agent will be identified by ID only
    console.log(`Web interface requesting installation for agent: ${agentId}`);

    // Prepare installation payload
    const payload = {
      appId: appId || appName,
      appName: appName,
      installationMethod: installationMethod || "WINGET",
      downloadUrl: downloadUrl,
      timestamp: new Date().toISOString(),
    };

    // Perform remote installation
    const result = await remoteInstallationService.installUpdateRemotely(
      payload,
      agentId
    );

    res.json({
      success: true,
      message: "Installation request sent to agent",
      data: {
        agentId: agentId,
        appName: appName,
        result: result,
      },
    });
  } catch (error) {
    console.error("Direct installation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Get all available agents
// @route   GET /api/agent/agents
// @access  Public (no authentication required)
router.get("/agents", async (req, res) => {
  try {
    const agents = Array.from(
      remoteInstallationService.installationAgents.values()
    ).map((agent) => ({
      id: agent.id,
      system: agent.system,
      capabilities: agent.capabilities,
      status: agent.status,
      lastSeen: agent.lastSeen,
      lastMessage: agent.lastMessage,
    }));

    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    console.error("Get agents error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Start agent automatically
// @route   POST /api/agent/start
// @access  Public (no authentication required)
router.post("/start", async (req, res) => {
  try {
    const { agentId, apiKey } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: agentId",
      });
    }

    // Use default API key if not provided
    const finalApiKey = apiKey || "mysecretkey123";

    // Register the agent if it doesn't exist
    let agent = remoteInstallationService.installationAgents.get(agentId);
    if (!agent) {
      agent = remoteInstallationService.registerAgent(agentId, {
        url: `http://localhost:8080`,
        apiKey: finalApiKey,
        system: "WINDOWS",
        capabilities: ["WINGET", "CHOCOLATEY", "MANUAL"],
      });
    }

    // Update agent status to ONLINE
    agent.status = "ONLINE";
    agent.lastSeen = new Date();
    agent.lastMessage = "Agent started via web interface";

    console.log(`Agent ${agentId} started via web interface`);

    res.json({
      success: true,
      message: "Agent started successfully",
      data: {
        agentId: agent.id,
        status: agent.status,
      },
    });
  } catch (error) {
    console.error("Start agent error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Get agent status
// @route   GET /api/agent/status
// @access  Public
router.get("/status", async (req, res) => {
  try {
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: agentId",
      });
    }

    const agent = remoteInstallationService.installationAgents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: agent.id,
        system: agent.system,
        capabilities: agent.capabilities,
        status: agent.status,
        lastSeen: agent.lastSeen,
        lastMessage: agent.lastMessage,
      },
    });
  } catch (error) {
    console.error("Get agent status error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Stop agent
// @route   POST /api/agent/stop
// @access  Public (no authentication required)
router.post("/stop", async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: agentId",
      });
    }

    // Find the agent
    const agent = remoteInstallationService.installationAgents.get(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
      });
    }

    // Update agent status to OFFLINE
    agent.status = "OFFLINE";
    agent.lastSeen = new Date();
    agent.lastMessage = "Agent stopped via web interface";

    console.log(`Agent ${agentId} stopped via web interface`);

    res.json({
      success: true,
      message: "Agent stopped successfully",
      data: {
        agentId: agent.id,
        status: agent.status,
      },
    });
  } catch (error) {
    console.error("Stop agent error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

module.exports = router;
