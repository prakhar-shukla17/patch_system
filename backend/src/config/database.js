const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/patch-management-system";

    console.log("🔗 Attempting to connect to MongoDB...");
    console.log(`📡 URI: ${mongoURI.replace(/\/\/.*@/, "//***:***@")}`); // Hide credentials in logs

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    console.log("\n🔧 To fix this issue:");
    console.log(
      "1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
    );
    console.log("2. Or use MongoDB Atlas: https://www.mongodb.com/atlas");
    console.log("3. Create a .env file in the backend directory with:");
    console.log("   MONGODB_URI=your-mongodb-connection-string");
    console.log("4. Or use the provided Atlas URI from env.example");
    process.exit(1);
  }
};

module.exports = connectDB;
