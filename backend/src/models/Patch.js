const mongoose = require("mongoose");

const patchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patch name is required"],
    },
    wingetAppId: {
      type: String,
      required: [true, "Winget app ID is required"],
    },
    currentVersion: {
      type: String,
      default: "Unknown",
    },
    latestVersion: {
      type: String,
      default: "Unknown",
    },
    updateAvailable: {
      type: Boolean,
      default: false,
    },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"],
      default: "NONE",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "INSTALLED", "FAILED", "IGNORED"],
      default: "PENDING",
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    // Remote installation fields
    remoteInstallation: {
      enabled: {
        type: Boolean,
        default: false,
      },
      targetSystem: {
        type: String,
        enum: ["WINDOWS", "LINUX", "MACOS"],
        default: "WINDOWS",
      },
      installationMethod: {
        type: String,
        enum: ["WINGET", "CHOCOLATEY", "APT", "BREW", "MANUAL"],
        default: "WINGET",
      },
      downloadUrl: {
        type: String,
        default: null,
      },
      installationScript: {
        type: String,
        default: null,
      },
      lastInstallationAttempt: {
        type: Date,
        default: null,
      },
      installationLog: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Patch", patchSchema);
