export interface SystemInfo {
  hostname: string
  macAddress: string
  ipAddress: string
  osType: string
  platform: string
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    // Get system information using browser APIs where available
    const systemInfo: SystemInfo = {
      hostname: 'Unknown',
      macAddress: 'Unknown',
      ipAddress: 'Unknown',
      osType: 'Unknown',
      platform: navigator.platform || 'Unknown'
    }

    // Try to get hostname from various sources
    if (typeof window !== 'undefined') {
      // Get OS type from user agent
      const userAgent = navigator.userAgent
      if (userAgent.includes('Windows')) {
        systemInfo.osType = 'Windows'
      } else if (userAgent.includes('Mac')) {
        systemInfo.osType = 'macOS'
      } else if (userAgent.includes('Linux')) {
        systemInfo.osType = 'Linux'
      } else if (userAgent.includes('Unix')) {
        systemInfo.osType = 'Unix'
      }

      // Try to get IP address using a public API
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        systemInfo.ipAddress = data.ip
      } catch (error) {
        console.warn('Could not fetch IP address:', error)
      }

      // Try to get hostname from various sources
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        systemInfo.hostname = window.location.hostname
      } else {
        // Fallback to a generated hostname
        systemInfo.hostname = `Device-${Math.random().toString(36).substr(2, 9)}`
      }
    }

    // Note: MAC address cannot be obtained from browser for security reasons
    // This would need to be implemented on the backend or through a native app
    systemInfo.macAddress = 'Requires backend detection'

    return systemInfo
  } catch (error) {
    console.error('Error getting system info:', error)
    return {
      hostname: 'Unknown',
      macAddress: 'Unknown',
      ipAddress: 'Unknown',
      osType: 'Unknown',
      platform: 'Unknown'
    }
  }
}

// Function to get system info from backend (if available)
export async function getSystemInfoFromBackend(): Promise<SystemInfo> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('auth_token')
    
    if (!token) {
      console.warn('No auth token found, using client-side detection')
      return getSystemInfo()
    }
    
    const response = await fetch('/api/system-info', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data
    } else {
      console.warn('Backend system info failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.warn('Backend system info not available:', error)
  }
  
  // Fallback to client-side detection
  return getSystemInfo()
}
