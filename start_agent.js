#!/usr/bin/env node

const WebAgentService = require("./backend/src/services/webAgentService");

async function startAgent() {
  const port = process.env.AGENT_PORT || 6001;
  const agent = new WebAgentService();

  try {
    await agent.start(port);
    console.log(`\n🚀 Patch Agent started successfully!`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🌐 Network: http://0.0.0.0:${port}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /health       - Health check`);
    console.log(`   GET  /system-info  - System information`);
    console.log(`   GET  /scan-patches - Scan for patches`);
    console.log(`   POST /install-update - Install updates`);
    console.log(`\n💡 To stop the agent, press Ctrl+C`);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down agent...");
      agent.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down agent...");
      agent.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start agent:", error.message);
    process.exit(1);
  }
}

// Start the agent
startAgent();
