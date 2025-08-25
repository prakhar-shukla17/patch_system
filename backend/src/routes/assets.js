const express = require("express");
const { body, validationResult } = require("express-validator");
const Asset = require("../models/Asset");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get all assets for current user
// @route   GET /api/assets
// @access  Private
router.get("/", async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

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

    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error("Get asset error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Asset name is required"),
    body("ipAddress")
      .optional()
      .isIP()
      .withMessage("Please provide a valid IP address"),
    body("macAddress")
      .optional()
      .custom((value) => {
        if (!value || value === "Unknown") {
          return true; // Allow empty or "Unknown" values
        }
        return /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(value);
      })
      .withMessage("Please provide a valid MAC address format"),
    body("osType")
      .optional()
      .notEmpty()
      .withMessage("OS type cannot be empty if provided"),
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

      const { name, description, ipAddress, macAddress, osType } = req.body;

      // Check if asset with same MAC address already exists for this user
      if (macAddress && macAddress !== "Unknown") {
        const existingAsset = await Asset.findOne({
          userId: req.user.id,
          macAddress: macAddress,
        });

        if (existingAsset) {
          return res.status(409).json({
            success: false,
            error: "Asset with this MAC address already exists",
            data: existingAsset,
          });
        }
      }

      // Don't store "Unknown" MAC addresses
      const assetData = {
        name,
        description,
        ipAddress,
        osType,
        userId: req.user.id,
      };

      // Only add MAC address if it's valid
      if (macAddress && macAddress !== "Unknown") {
        assetData.macAddress = macAddress;
      }

      const asset = await Asset.create(assetData);

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      console.error("Create asset error:", error);

      // Handle duplicate key error for MAC address
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: "Asset with this MAC address already exists",
        });
      }

      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Asset name cannot be empty if provided"),
    body("ipAddress")
      .optional()
      .isIP()
      .withMessage("Please provide a valid IP address"),
    body("osType")
      .optional()
      .notEmpty()
      .withMessage("OS type cannot be empty if provided"),
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

      let asset = await Asset.findById(req.params.id);

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
          error: "Not authorized to update this asset",
        });
      }

      asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

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
        error: "Not authorized to delete this asset",
      });
    }

    await asset.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;
