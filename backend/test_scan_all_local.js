const PatchService = require("./src/services/patchService");

async function testScanAllLocalSystems() {
  console.log("Testing Scan All Local Systems...\n");

  const patchService = new PatchService();

  try {
    console.log("1. Testing scanAllLocalSystems method...");
    const results = await patchService.scanAllLocalSystems();

    console.log("\nResults:");
    console.log(`Success: ${results.success}`);
    console.log(`Message: ${results.message}`);
    console.log(`Total Systems: ${results.systems.length}`);

    if (results.systems.length > 0) {
      console.log("\nDiscovered Systems:");
      results.systems.forEach((system, index) => {
        console.log(`\n${index + 1}. ${system.name} (${system.ipAddress})`);
        console.log(`   MAC: ${system.macAddress}`);
        console.log(`   OS: ${system.osType}`);
        console.log(`   Platform: ${system.platform}`);
        console.log(
          `   Current System: ${system.isCurrentSystem ? "Yes" : "No"}`
        );
        console.log(`   Scanned: ${system.scanned ? "Yes" : "No"}`);
        console.log(`   Patch Count: ${system.patchCount || 0}`);

        if (system.scanned && system.patches && system.patches.length > 0) {
          console.log(`   Patches:`);
          system.patches.forEach((patch, pIndex) => {
            console.log(
              `     ${pIndex + 1}. ${patch.name} - ${
                patch.current_version
              } -> ${patch.latest_version} (${
                patch.update_available ? "Update Available" : "Up to Date"
              })`
            );
          });
        }
      });
    }

    console.log("\nScan all local systems test completed successfully!");
  } catch (error) {
    console.error("Error during scan all local systems test:", error);
  }
}

// Run the test
testScanAllLocalSystems();
