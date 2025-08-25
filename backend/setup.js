const fs = require("fs");
const path = require("path");

console.log("🔧 Patch Management System - Backend Setup");
console.log("==========================================\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, "env.example");

if (fs.existsSync(envPath)) {
  console.log("✅ .env file already exists");
} else {
  console.log("📝 Creating .env file from env.example...");

  if (fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log("✅ .env file created successfully!");
      console.log(
        "📋 Please review and update the .env file with your configuration."
      );
    } catch (error) {
      console.error("❌ Error creating .env file:", error.message);
    }
  } else {
    console.log("📝 Creating basic .env file...");
    const envContent = `# Backend Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB: mongodb://localhost:27017/patch-management-system
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_URI=mongodb://localhost:27017/patch-management-system

# JWT Configuration (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Optional: Redis Configuration
# REDIS_URL=redis://localhost:6379
`;

    try {
      fs.writeFileSync(envPath, envContent);
      console.log("✅ .env file created successfully!");
    } catch (error) {
      console.error("❌ Error creating .env file:", error.message);
    }
  }
}

console.log("\n📋 Next Steps:");
console.log("1. Review the .env file in the backend directory");
console.log("2. Update MONGODB_URI with your MongoDB connection string");
console.log("3. Update JWT_SECRET with a secure secret key");
console.log("4. Start the backend server: npm run dev");
console.log("\n🔗 MongoDB Options:");
console.log("- Local MongoDB: Install MongoDB locally");
console.log("- MongoDB Atlas: Use cloud MongoDB (free tier available)");
console.log("\n🚀 Ready to start!");

























