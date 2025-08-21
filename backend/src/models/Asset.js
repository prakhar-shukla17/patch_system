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

module.exports = mongoose.model("Asset", AssetSchema);








