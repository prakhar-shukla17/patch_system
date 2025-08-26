#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple script to install applications using the remote agent
No JWT authentication required - just API key
"""

import requests
import json
import sys

def install_app(agent_id, api_key, server_url, app_name, app_id=None, installation_method="WINGET", download_url=None):
    """Install an application using the remote agent"""
    
    print(f"Installing application...")
    print(f"Agent ID: {agent_id}")
    print(f"App Name: {app_name}")
    print(f"App ID: {app_id or app_name}")
    print(f"Method: {installation_method}")
    print(f"Server: {server_url}")
    print("-" * 50)
    
    try:
        payload = {
            "agentId": agent_id,
            "appName": app_name,
            "appId": app_id or app_name,
            "installationMethod": installation_method,
            "downloadUrl": download_url
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{server_url}/api/agent/install",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Installation request sent successfully!")
            print(f"Message: {result.get('message', 'No message')}")
            print(f"Agent: {result.get('data', {}).get('agentId', 'Unknown')}")
            return True
        else:
            print(f"❌ Installation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    if len(sys.argv) < 5:
        print("Usage: python install_app.py <agent_id> <api_key> <server_url> <app_name> [app_id] [installation_method]")
        print("")
        print("Examples:")
        print("  python install_app.py test-agent-001 mysecretkey123 http://localhost:5000 Docker.DockerDesktop")
        print("  python install_app.py test-agent-001 mysecretkey123 http://localhost:5000 'Visual Studio Code' Microsoft.VisualStudioCode")
        print("  python install_app.py test-agent-001 mysecretkey123 http://localhost:5000 chrome Google.Chrome")
        print("")
        print("Installation methods: WINGET, CHOCOLATEY, MANUAL")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    api_key = sys.argv[2]
    server_url = sys.argv[3]
    app_name = sys.argv[4]
    app_id = sys.argv[5] if len(sys.argv) > 5 else None
    installation_method = sys.argv[6] if len(sys.argv) > 6 else "WINGET"
    
    success = install_app(agent_id, api_key, server_url, app_name, app_id, installation_method)
    
    if success:
        print("\n🎉 Installation request sent! Check the agent terminal for progress.")
        print("The agent will install the application and report back the results.")
    else:
        print("\n❌ Failed to send installation request.")
        print("Please check:")
        print("1. Agent is running")
        print("2. API key is correct")
        print("3. Server URL is accessible")
        sys.exit(1)

if __name__ == "__main__":
    main()


























