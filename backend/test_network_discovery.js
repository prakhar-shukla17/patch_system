const NetworkDiscoveryService = require('./src/services/networkDiscoveryService');

async function testNetworkDiscovery() {
  console.log('Testing Network Discovery Service...\n');
  
  const discoveryService = new NetworkDiscoveryService();
  
  try {
    console.log('1. Getting local IP address...');
    const localIP = discoveryService.getLocalIPAddress();
    console.log(`   Local IP: ${localIP}`);
    
    console.log('\n2. Getting network prefix...');
    const networkPrefix = discoveryService.getNetworkPrefix(localIP);
    console.log(`   Network prefix: ${networkPrefix}*`);
    
    console.log('\n3. Getting MAC address...');
    const macAddress = await discoveryService.getMACAddress();
    console.log(`   MAC Address: ${macAddress}`);
    
    console.log('\n4. Discovering local systems...');
    const discoveredSystems = await discoveryService.discoverLocalSystems();
    
    console.log(`\n   Found ${discoveredSystems.length} systems:`);
    discoveredSystems.forEach((system, index) => {
      console.log(`   ${index + 1}. ${system.hostname} (${system.ipAddress})`);
      console.log(`      MAC: ${system.macAddress}`);
      console.log(`      OS: ${system.osType}`);
      console.log(`      Platform: ${system.platform}`);
      console.log(`      Current System: ${system.isCurrentSystem ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log('Network discovery test completed successfully!');
    
  } catch (error) {
    console.error('Error during network discovery test:', error);
  }
}

// Run the test
testNetworkDiscovery();
