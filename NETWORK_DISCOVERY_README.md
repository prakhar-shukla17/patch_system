# Network Discovery Feature

## Overview

The Network Discovery feature allows the patch management system to automatically discover and scan all systems connected to your local network for patches and updates. This feature eliminates the need to manually add each system as an asset.

## How It Works

### 1. Network Discovery
- Uses ARP (Address Resolution Protocol) tables to discover devices on the local network
- Pings broadcast addresses to populate the ARP table
- Extracts IP addresses, MAC addresses, and attempts to resolve hostnames
- Works on Windows, Linux, and macOS

### 2. System Detection
- Discovers all systems on the same subnet as the server
- Identifies the current system (where the service is running)
- Attempts to determine OS type and platform information
- Resolves hostnames where possible

### 3. Asset Management
- Automatically creates or updates assets for discovered systems
- Uses MAC address as primary identifier to avoid duplicates
- Falls back to IP address if MAC address is not available
- Updates existing assets with latest information

### 4. Patch Scanning
- Currently scans for patches on the current system only
- Remote patch scanning requires additional implementation
- Creates patch records for discovered applications
- Determines severity and status for each patch

## Usage

### From Dashboard
1. Navigate to the main dashboard
2. Click the "Scan All Local Systems" button in the Network Discovery section
3. Wait for the scan to complete
4. Review the results showing discovered systems and patches

### From Assets Page
1. Navigate to the Assets page
2. Click the "Scan Local Network" button in the top action bar
3. Wait for the scan to complete
4. View newly created assets in the list

## API Endpoints

### POST /api/patches/scan-all-local
Scans all locally connected systems and creates/updates assets and patches.

**Response:**
```json
{
  "success": true,
  "message": "Successfully scanned 5 systems on the local network",
  "data": {
    "systems": [
      {
        "name": "DESKTOP-ABC123",
        "ipAddress": "192.168.1.100",
        "macAddress": "00:11:22:33:44:55",
        "osType": "Windows",
        "platform": "win32",
        "isCurrentSystem": true,
        "scanned": true,
        "patchCount": 3,
        "assetId": "asset_id_here"
      }
    ],
    "totalSystems": 5,
    "scannedSystems": 1,
    "totalPatches": 3
  }
}
```

## Technical Details

### Network Discovery Service
- **File:** `backend/src/services/networkDiscoveryService.js`
- **Platform Support:** Windows, Linux, macOS
- **Discovery Methods:**
  - Windows: `arp -a` and `nbtstat -A`
  - Linux: `arp -n` and `host`
  - macOS: `arp -n` and `host`

### Patch Service Integration
- **File:** `backend/src/services/patchService.js`
- **New Method:** `scanAllLocalSystems()`
- **Integration:** Automatically creates assets and patches for discovered systems

### Frontend Integration
- **Dashboard:** Added "Scan All Local Systems" button
- **Assets Page:** Added "Scan Local Network" button
- **API Client:** Added `scanAllLocalSystems()` method

## Limitations

### Current Limitations
1. **Remote Patch Scanning:** Only scans the current system for patches
2. **OS Detection:** Limited OS detection for remote systems
3. **Network Access:** Requires network access and appropriate permissions
4. **Firewall:** May be blocked by firewalls or security software

### Future Enhancements
1. **Remote Patch Scanning:** Implement remote patch scanning for discovered systems
2. **Agent-based Scanning:** Deploy lightweight agents on remote systems
3. **Enhanced OS Detection:** Improve OS detection for remote systems
4. **Network Topology:** Support for complex network topologies
5. **Scheduled Scanning:** Automatic periodic network discovery

## Testing

### Manual Testing
Run the test script to verify network discovery:
```bash
cd backend
node test_network_discovery.js
```

### Expected Output
```
Testing Network Discovery Service...

1. Getting local IP address...
   Local IP: 192.168.1.100

2. Getting network prefix...
   Network prefix: 192.168.1.*

3. Getting MAC address...
   MAC Address: 00:11:22:33:44:55

4. Discovering local systems...

   Found 5 systems:
   1. DESKTOP-ABC123 (192.168.1.100)
      MAC: 00:11:22:33:44:55
      OS: Windows
      Platform: win32
      Current System: Yes

   2. LAPTOP-XYZ789 (192.168.1.101)
      MAC: aa:bb:cc:dd:ee:ff
      OS: Unknown
      Platform: Unknown
      Current System: No

Network discovery test completed successfully!
```

## Security Considerations

1. **Network Access:** The service requires network access to discover systems
2. **Permissions:** May require elevated permissions on some systems
3. **Privacy:** Only discovers systems on the local network
4. **Authentication:** All API endpoints require authentication
5. **Authorization:** Users can only access their own assets and patches

## Troubleshooting

### Common Issues

1. **No Systems Discovered**
   - Check network connectivity
   - Verify firewall settings
   - Ensure proper permissions

2. **Permission Denied**
   - Run with appropriate permissions
   - Check system security settings

3. **ARP Table Empty**
   - Try pinging broadcast address manually
   - Check network configuration

4. **Hostname Resolution Fails**
   - This is normal for some systems
   - IP address will be used as fallback

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=network-discovery node server.js
```

## Configuration

### Environment Variables
No additional configuration required. The service automatically detects:
- Network interfaces
- Platform type
- Available commands

### Network Configuration
- Works with standard IPv4 networks
- Supports common subnet masks (255.255.255.0, 255.255.0.0, etc.)
- Automatically detects network prefix from local IP
