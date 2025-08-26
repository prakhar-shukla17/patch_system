#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Remote Installation Agent
This script runs on target systems to receive and execute installation commands
"""

import subprocess
import json
import sys
import os
import time
import requests
import platform
import socket
from datetime import datetime

class RemoteAgent:
    def __init__(self, agent_id, api_key, server_url):
        self.agent_id = agent_id
        self.api_key = api_key
        self.server_url = server_url
        self.system = self.detect_system()
        self.capabilities = self.detect_capabilities()
        
    def detect_system(self):
        """Detect the operating system"""
        system = platform.system().upper()
        if system == "WINDOWS":
            return "WINDOWS"
        elif system == "LINUX":
            return "LINUX"
        elif system == "DARWIN":
            return "MACOS"
        else:
            return "UNKNOWN"
    
    def detect_capabilities(self):
        """Detect available package managers and installation methods"""
        capabilities = []
        
        # Check for winget (Windows)
        if self.system == "WINDOWS":
            if self.check_command("winget"):
                capabilities.append("WINGET")
            if self.check_command("choco"):
                capabilities.append("CHOCOLATEY")
        
        # Check for apt (Linux)
        elif self.system == "LINUX":
            if self.check_command("apt"):
                capabilities.append("APT")
            if self.check_command("brew"):
                capabilities.append("BREW")
        
        # Check for brew (macOS)
        elif self.system == "MACOS":
            if self.check_command("brew"):
                capabilities.append("BREW")
        
        # Manual installation is always available
        capabilities.append("MANUAL")
        
        return capabilities
    
    def check_command(self, command):
        """Check if a command is available"""
        try:
            subprocess.run([command, "--version"], 
                         capture_output=True, 
                         check=True, 
                         timeout=5)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def send_status(self, status, message=""):
        """Send status update to server"""
        try:
            payload = {
                "agentId": self.agent_id,
                "status": status,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "system": self.system,
                "capabilities": self.capabilities
            }
            
            response = requests.post(
                f"{self.server_url}/api/agent/status",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"Status sent: {status} - {message}")
            else:
                print(f"Failed to send status: {response.status_code}")
                
        except Exception as e:
            print(f"Error sending status: {e}")
    
    def execute_installation(self, payload):
        """Execute installation based on payload"""
        app_name = payload.get("appName", "")
        installation_method = payload.get("installationMethod", "MANUAL")
        download_url = payload.get("downloadUrl", "")
        
        print(f"Installing: {app_name}")
        print(f"Method: {installation_method}")
        
        self.send_status("INSTALLING", f"Installing {app_name}")
        
        success = False
        output = ""
        error = ""
        
        try:
            if installation_method == "WINGET" and self.system == "WINDOWS":
                success, output, error = self.install_with_winget(app_name)
            elif installation_method == "CHOCOLATEY" and self.system == "WINDOWS":
                success, output, error = self.install_with_chocolatey(app_name)
            elif installation_method == "APT" and self.system == "LINUX":
                success, output, error = self.install_with_apt(app_name)
            elif installation_method == "BREW":
                success, output, error = self.install_with_brew(app_name)
            elif installation_method == "MANUAL":
                success, output, error = self.install_manual(app_name, download_url)
            else:
                error = f"Installation method {installation_method} not supported on {self.system}"
        
        except Exception as e:
            error = str(e)
        
        # Send final status
        if success:
            self.send_status("SUCCESS", f"Successfully installed {app_name}")
            print(f"✅ Successfully installed {app_name}")
        else:
            self.send_status("FAILED", f"Failed to install {app_name}: {error}")
            print(f"❌ Failed to install {app_name}: {error}")
        
        return {
            "success": success,
            "output": output,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
    
    def install_with_winget(self, app_name):
        """Install using winget"""
        try:
            result = subprocess.run(
                ["winget", "install", "--id", app_name, "--accept-source-agreements", "--accept-package-agreements"],
                capture_output=True,
                text=True,
                check=True,
                timeout=300
            )
            return True, result.stdout, ""
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Installation timed out"
    
    def install_with_chocolatey(self, app_name):
        """Install using Chocolatey"""
        try:
            result = subprocess.run(
                ["choco", "install", app_name, "-y"],
                capture_output=True,
                text=True,
                check=True,
                timeout=300
            )
            return True, result.stdout, ""
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Installation timed out"
    
    def install_with_apt(self, app_name):
        """Install using apt"""
        try:
            # Update package list
            subprocess.run(["sudo", "apt", "update"], 
                         capture_output=True, 
                         check=True, 
                         timeout=60)
            
            # Install package
            result = subprocess.run(
                ["sudo", "apt", "install", "-y", app_name],
                capture_output=True,
                text=True,
                check=True,
                timeout=300
            )
            return True, result.stdout, ""
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Installation timed out"
    
    def install_with_brew(self, app_name):
        """Install using Homebrew"""
        try:
            result = subprocess.run(
                ["brew", "install", app_name],
                capture_output=True,
                text=True,
                check=True,
                timeout=300
            )
            return True, result.stdout, ""
        except subprocess.CalledProcessError as e:
            return False, e.stdout, e.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Installation timed out"
    
    def install_manual(self, app_name, download_url):
        """Manual installation by opening download URL"""
        try:
            if download_url:
                print(f"Opening download URL: {download_url}")
                
                if self.system == "WINDOWS":
                    subprocess.run(["start", download_url], shell=True)
                elif self.system == "LINUX":
                    subprocess.run(["xdg-open", download_url])
                elif self.system == "MACOS":
                    subprocess.run(["open", download_url])
                
                return True, f"Opened download URL: {download_url}", ""
            else:
                return False, "", f"No download URL provided for {app_name}"
        except Exception as e:
            return False, "", str(e)
    
    def get_system_info(self):
        """Get detailed system information"""
        return {
            "hostname": socket.gethostname(),
            "system": self.system,
            "platform": platform.platform(),
            "capabilities": self.capabilities,
            "python_version": sys.version,
            "timestamp": datetime.now().isoformat()
        }
    
    def run(self):
        """Main agent loop"""
        print(f"🚀 Starting Remote Installation Agent")
        print(f"Agent ID: {self.agent_id}")
        print(f"System: {self.system}")
        print(f"Capabilities: {', '.join(self.capabilities)}")
        print(f"Server URL: {self.server_url}")
        
        # Send initial status
        self.send_status("ONLINE", "Agent started")
        
        # Main loop - check for commands every 30 seconds
        while True:
            try:
                # Send heartbeat
                self.send_status("ONLINE", "Agent is running")
                
                # Sleep for 30 seconds
                time.sleep(30)
                
            except KeyboardInterrupt:
                print("\n🛑 Agent stopped by user")
                self.send_status("OFFLINE", "Agent stopped by user")
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(30)

def main():
    if len(sys.argv) != 4:
        print("Usage: python remote_agent.py <agent_id> <api_key> <server_url>")
        print("Example: python remote_agent.py agent001 mysecretkey http://localhost:5000")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    api_key = sys.argv[2]
    server_url = sys.argv[3]
    
    agent = RemoteAgent(agent_id, api_key, server_url)
    agent.run()

if __name__ == "__main__":
    main()



























