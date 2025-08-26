#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automated Agent Starter
This script simulates a remote agent that automatically starts and responds to installation requests
"""

import requests
import json
import sys
import time
import subprocess
import threading
import os
from datetime import datetime

class AutoAgent:
    def __init__(self, agent_id, api_key, server_url):
        self.agent_id = agent_id
        self.api_key = api_key
        self.server_url = server_url
        self.running = False
        self.installation_queue = []
        
    def send_status(self, status, message=""):
        """Send status update to server"""
        try:
            payload = {
                "agentId": self.agent_id,
                "status": status,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "system": "WINDOWS",
                "capabilities": ["WINGET", "CHOCOLATEY", "MANUAL"]
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.server_url}/api/agent/status",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Status sent: {status} - {message}")
                return True
            else:
                print(f"❌ Status failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending status: {e}")
            return False
    
    def install_application(self, app_name, app_id, installation_method="WINGET"):
        """Install an application using the specified method"""
        print(f"\n🚀 Installing: {app_name}")
        print(f"App ID: {app_id}")
        print(f"Method: {installation_method}")
        
        self.send_status("INSTALLING", f"Installing {app_name}")
        
        try:
            if installation_method == "WINGET":
                # Try with --id first
                try:
                    result = subprocess.run(
                        ["winget", "upgrade", "--id", app_id, "--accept-source-agreements", "--accept-package-agreements"],
                        capture_output=True,
                        text=True,
                        timeout=300,  # 5 minutes timeout
                        check=True
                    )
                    print(f"✅ Successfully installed {app_name}")
                    self.send_status("SUCCESS", f"Successfully installed {app_name}")
                    return True
                except subprocess.CalledProcessError:
                    # Try with --name if --id fails
                    result = subprocess.run(
                        ["winget", "upgrade", "--name", app_id, "--accept-source-agreements", "--accept-package-agreements"],
                        capture_output=True,
                        text=True,
                        timeout=300,
                        check=True
                    )
                    print(f"✅ Successfully installed {app_name}")
                    self.send_status("SUCCESS", f"Successfully installed {app_name}")
                    return True
                    
            elif installation_method == "CHOCOLATEY":
                result = subprocess.run(
                    ["choco", "upgrade", app_id, "-y"],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    check=True
                )
                print(f"✅ Successfully installed {app_name} via Chocolatey")
                self.send_status("SUCCESS", f"Successfully installed {app_name} via Chocolatey")
                return True
                
            else:
                print(f"❌ Unsupported installation method: {installation_method}")
                self.send_status("FAILED", f"Unsupported installation method: {installation_method}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"❌ Installation timed out for {app_name}")
            self.send_status("FAILED", f"Installation timed out for {app_name}")
            return False
        except subprocess.CalledProcessError as e:
            print(f"❌ Installation failed for {app_name}: {e.stderr}")
            self.send_status("FAILED", f"Installation failed for {app_name}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error installing {app_name}: {e}")
            self.send_status("FAILED", f"Unexpected error installing {app_name}")
            return False
    
    def check_for_installations(self):
        """Check for new installation requests"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Check if there are any pending installations
            response = requests.get(
                f"{self.server_url}/api/agent/status?agentId={self.agent_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    agent_data = data.get('data', {})
                    last_message = agent_data.get('lastMessage', '')
                    
                    # Check if there's an installation request
                    if 'install' in last_message.lower() or 'installation' in last_message.lower():
                        # This is a simplified check - in a real implementation, you'd have a proper queue
                        print(f"📥 Installation request detected: {last_message}")
                        
        except Exception as e:
            print(f"❌ Error checking for installations: {e}")
    
    def run(self):
        """Main agent loop"""
        print(f"🚀 Starting Auto Agent")
        print(f"Agent ID: {self.agent_id}")
        print(f"Server URL: {self.server_url}")
        print(f"System: WINDOWS")
        print(f"Capabilities: WINGET, CHOCOLATEY, MANUAL")
        print("-" * 50)
        
        self.running = True
        
        # Send initial status
        self.send_status("ONLINE", "Auto agent started")
        
        # Main loop
        while self.running:
            try:
                # Send heartbeat
                self.send_status("ONLINE", "Auto agent is running")
                
                # Check for installations (simplified)
                self.check_for_installations()
                
                # Wait before next iteration
                time.sleep(30)
                
            except KeyboardInterrupt:
                print("\n🛑 Auto agent stopped by user")
                self.send_status("OFFLINE", "Auto agent stopped by user")
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                time.sleep(30)
    
    def stop(self):
        """Stop the agent"""
        self.running = False
        self.send_status("OFFLINE", "Auto agent stopped")

def main():
    if len(sys.argv) != 4:
        print("Usage: python auto_agent.py <agent_id> <api_key> <server_url>")
        print("Example: python auto_agent.py test-agent-001 mysecretkey123 http://localhost:5000")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    api_key = sys.argv[2]
    server_url = sys.argv[3]
    
    agent = AutoAgent(agent_id, api_key, server_url)
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Stopping auto agent...")
        agent.stop()

if __name__ == "__main__":
    main()


























