const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
    },
    description: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    macAddress: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allows multiple null/undefined values
    },
    osType: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for userId and macAddress to ensure uniqueness per user
AssetSchema.index({ userId: 1, macAddress: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Asset", AssetSchema);
