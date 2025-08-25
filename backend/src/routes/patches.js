const express = require("express");
const { body, validationResult } = require("express-validator");
const Patch = require("../models/Patch");
const Asset = require("../models/Asset");
const { protect } = require("../middleware/auth");
const PatchService = require("../services/patchService");
const RemoteInstallationService = require("../services/remoteInstallationService");

// Initialize remote installation service
const remoteInstallationService = new RemoteInstallationService();

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get all patches for current user
// @route   GET /api/patches
// @access  Private
router.get("/", async (req, res) => {
  try {
    // Get all assets for the current user
    const assets = await Asset.find({ userId: req.user.id });
    const assetIds = assets.map((asset) => asset._id);

    // Get all patches for these assets
    const patches = await Patch.find({ assetId: { $in: assetIds } })
      .populate("assetId", "name")
      .sort({ createdAt: -1 });

    // Transform the data to include asset information
    const patchesWithAsset = patches.map((patch) => ({
      ...patch.toObject(),
      asset: {
        _id: patch.assetId._id,
        name: patch.assetId.name,
      },
    }));

    res.json({
      success: true,
      count: patches.length,
      data: patchesWithAsset,
    });
  } catch (error) {
    console.error("Get all patches error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get all patches for an asset
// @route   GET /api/patches/asset/:assetId
// @access  Private
router.get("/asset/:assetId", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
      });
    }

    // Check if asset belongs to user
    if (asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this asset",
      });
    }

    const patches = await Patch.find({ assetId: req.params.assetId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: patches.length,
      data: patches,
    });
  } catch (error) {
    console.error("Get patches error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Scan for patches on an asset
// @route   POST /api/patches/scan/:assetId
// @access  Private
router.post("/scan/:assetId", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: "Asset not found",
      });
    }

    // Check if asset belongs to user
    if (asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this asset",
      });
    }

    // Initialize patch service
    const patchService = new PatchService();

    // Scan for patches
    const patchInfo = await patchService.getInstalledApps();

    // Clear existing patches for this asset
    await Patch.deleteMany({ assetId: req.params.assetId });

    // Create new patch records
    const patches = [];
    for (const app of patchInfo) {
      // Handle different field names from Python script
      const currentVersion =
        app.current_version || app.currentVersion || "Unknown";
      const latestVersion =
        app.latest_version || app.latestVersion || currentVersion;
      const updateAvailable =
        app.update_available !== undefined
          ? app.update_available
          : app.updateAvailable;

      const severity = patchService.determineSeverity(
        app.name,
        currentVersion,
        latestVersion,
        updateAvailable
      );

      const status = patchService.determineStatus(updateAvailable);

      const patch = await Patch.create({
        name: app.name,
        wingetAppId: app.id || app.name, // Use the winget app ID
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        updateAvailable: updateAvailable,
        severity,
        status,
        assetId: req.params.assetId,
      });

      console.log(
        `Created patch for ${app.name} with wingetAppId: ${app.id || app.name}`
      );

      patches.push(patch);
    }

    res.json({
      success: true,
      message: `Successfully scanned for patches. Found ${patches.length} applications.`,
      data: patches,
    });
  } catch (error) {
    console.error("Scan patches error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Get download URL for a patch
// @route   GET /api/patches/:id/download-url
// @access  Private
router.get("/:id/download-url", async (req, res) => {
  try {
    const patch = await Patch.findById(req.params.id);

    if (!patch) {
      return res.status(404).json({
        success: false,
        error: "Patch not found",
      });
    }

    // Check if patch belongs to user's asset
    const asset = await Asset.findById(patch.assetId);
    if (!asset || asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this patch",
      });
    }

    // Get the app ID for the download URL request
    const appId = patch.wingetAppId || patch.name;

    if (!appId) {
      return res.status(400).json({
        success: false,
        error: "No valid application identifier found",
      });
    }

    // Initialize patch service and get download URL
    const patchService = new PatchService();
    const downloadResult = await patchService.getDownloadUrl(appId);

    res.json({
      success: true,
      data: {
        patch: patch,
        downloadUrl: downloadResult.download_url,
        message: downloadResult.message,
      },
    });
  } catch (error) {
    console.error("Get download URL error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Update patch status
// @route   PUT /api/patches/:id
// @access  Private
router.put(
  "/:id",
  [
    body("status")
      .isIn(["PENDING", "APPROVED", "INSTALLED", "FAILED", "IGNORED"])
      .withMessage("Invalid status value"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: errors.array(),
        });
      }

      const patch = await Patch.findById(req.params.id);

      if (!patch) {
        return res.status(404).json({
          success: false,
          error: "Patch not found",
        });
      }

      // Check if patch belongs to user's asset
      const asset = await Asset.findById(patch.assetId);
      if (!asset || asset.userId.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          error: "Not authorized to update this patch",
        });
      }

      patch.status = req.body.status;
      await patch.save();

      res.json({
        success: true,
        data: patch,
      });
    } catch (error) {
      console.error("Update patch error:", error);
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Get patch statistics
// @route   GET /api/patches/stats
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    // Get all assets for the user
    const assets = await Asset.find({ userId: req.user.id });
    const assetIds = assets.map((asset) => asset._id);

    // Get patch statistics
    const totalPatches = await Patch.countDocuments({
      assetId: { $in: assetIds },
    });
    const pendingPatches = await Patch.countDocuments({
      assetId: { $in: assetIds },
      status: "PENDING",
    });
    const criticalPatches = await Patch.countDocuments({
      assetId: { $in: assetIds },
      severity: "CRITICAL",
    });
    const installedPatches = await Patch.countDocuments({
      assetId: { $in: assetIds },
      status: "INSTALLED",
    });

    res.json({
      success: true,
      data: {
        totalPatches,
        pendingPatches,
        criticalPatches,
        installedPatches,
        totalAssets: assets.length,
      },
    });
  } catch (error) {
    console.error("Get patch stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Install update for a patch
// @route   POST /api/patches/:id/install
// @access  Private
router.post("/:id/install", async (req, res) => {
  try {
    const patch = await Patch.findById(req.params.id);

    if (!patch) {
      return res.status(404).json({
        success: false,
        error: "Patch not found",
      });
    }

    // Check if patch belongs to user's asset
    const asset = await Asset.findById(patch.assetId);
    if (!asset || asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to install this patch",
      });
    }

    // Check if update is available
    if (!patch.updateAvailable) {
      return res.status(400).json({
        success: false,
        error: "No update available for this application",
      });
    }

    // Check if we have a valid app ID
    if (!patch.wingetAppId && !patch.name) {
      return res.status(400).json({
        success: false,
        error: "No valid application identifier found",
      });
    }

    if (!patch.wingetAppId) {
      console.log(
        `Warning: Patch ${patch._id} (${patch.name}) has no wingetAppId, using name as fallback`
      );
    }

    // Initialize patch service
    const patchService = new PatchService();

    // Install the update - use the winget app ID from the patch data
    // Handle existing patches that might not have wingetAppId field
    const appId = patch.wingetAppId || patch.name;
    console.log("Installing update for app ID:", appId);
    console.log("Patch data:", {
      id: patch._id,
      name: patch.name,
      wingetAppId: patch.wingetAppId,
      updateAvailable: patch.updateAvailable,
    });
    const installResult = await patchService.installUpdate(appId);

    // Update patch status to INSTALLED
    patch.status = "INSTALLED";
    patch.updateAvailable = false;
    await patch.save();

    res.json({
      success: true,
      message: "Update installed successfully",
      data: {
        patch,
        installResult,
      },
    });
  } catch (error) {
    console.error("Install patch error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Delete patch
// @route   DELETE /api/patches/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const patch = await Patch.findById(req.params.id);

    if (!patch) {
      return res.status(404).json({
        success: false,
        error: "Patch not found",
      });
    }

    // Check if patch belongs to user's asset
    const asset = await Asset.findById(patch.assetId);
    if (!asset || asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to delete this patch",
      });
    }

    await patch.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete patch error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Register a remote installation agent
// @route   POST /api/patches/agents/register
// @access  Private
router.post("/agents/register", async (req, res) => {
  try {
    const { agentId, url, apiKey, system, capabilities } = req.body;

    if (!agentId || !url || !apiKey || !system) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId, url, apiKey, system",
      });
    }

    const agent = remoteInstallationService.registerAgent(agentId, {
      url,
      apiKey,
      system,
      capabilities: capabilities || [],
    });

    res.json({
      success: true,
      message: "Agent registered successfully",
      data: {
        agentId: agent.id,
        system: agent.system,
        capabilities: agent.capabilities,
      },
    });
  } catch (error) {
    console.error("Agent registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Get available installation agents
// @route   GET /api/patches/agents
// @access  Private
router.get("/agents", async (req, res) => {
  try {
    const { system, installationMethod } = req.query;

    let agents = [];
    if (system && installationMethod) {
      agents = remoteInstallationService.getAvailableAgents(
        system,
        installationMethod
      );
    } else {
      // Return all agents
      for (const [
        agentId,
        agent,
      ] of remoteInstallationService.installationAgents) {
        agents.push({
          id: agent.id,
          system: agent.system,
          capabilities: agent.capabilities,
          status: agent.status,
          lastSeen: agent.lastSeen,
        });
      }
    }

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

// @desc    Install update remotely
// @route   POST /api/patches/:id/install-remote
// @access  Private
router.post("/:id/install-remote", async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    const patch = await Patch.findById(req.params.id);

    if (!patch) {
      return res.status(404).json({
        success: false,
        error: "Patch not found",
      });
    }

    // Check if patch belongs to user's asset
    const asset = await Asset.findById(patch.assetId);
    if (!asset || asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this patch",
      });
    }

    // Check if update is available
    if (!patch.updateAvailable) {
      return res.status(400).json({
        success: false,
        error: "No update available for this application",
      });
    }

    // Perform remote installation
    const result = await remoteInstallationService.installUpdateRemotely(
      patch,
      agentId
    );

    // Update patch status based on result
    if (result.success) {
      patch.status = "INSTALLED";
      patch.updateAvailable = false;
      patch.remoteInstallation.lastInstallationAttempt = new Date();
      patch.remoteInstallation.installationLog = JSON.stringify(result);
      await patch.save();
    } else {
      patch.status = "FAILED";
      patch.remoteInstallation.lastInstallationAttempt = new Date();
      patch.remoteInstallation.installationLog = JSON.stringify(result);
      await patch.save();
    }

    res.json({
      success: true,
      data: {
        patch: patch,
        installationResult: result,
      },
    });
  } catch (error) {
    console.error("Remote installation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

// @desc    Generate installation script for a patch
// @route   GET /api/patches/:id/installation-script
// @access  Private
router.get("/:id/installation-script", async (req, res) => {
  try {
    const { system } = req.query;

    if (!system) {
      return res.status(400).json({
        success: false,
        error: "System parameter is required (WINDOWS, LINUX, MACOS)",
      });
    }

    const patch = await Patch.findById(req.params.id);

    if (!patch) {
      return res.status(404).json({
        success: false,
        error: "Patch not found",
      });
    }

    // Check if patch belongs to user's asset
    const asset = await Asset.findById(patch.assetId);
    if (!asset || asset.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized to access this patch",
      });
    }

    // Generate installation script
    const script = remoteInstallationService.generateInstallationScript(
      patch,
      system
    );

    res.json({
      success: true,
      data: {
        patch: patch,
        script: script,
        system: system,
      },
    });
  } catch (error) {
    console.error("Generate script error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
});

module.exports = router;
