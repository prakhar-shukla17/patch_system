#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify agent connectivity
"""

import requests
import json
import sys

def test_agent_connection(agent_id, api_key, server_url):
    """Test if the agent can connect to the server"""
    
    print(f"Testing agent connection...")
    print(f"Agent ID: {agent_id}")
    print(f"Server URL: {server_url}")
    print(f"API Key: {api_key[:8]}...")
    print("-" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{server_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Status update
    try:
        payload = {
            "agentId": agent_id,
            "status": "TESTING",
            "message": "Testing agent connectivity",
            "system": "WINDOWS",
            "capabilities": ["WINGET", "CHOCOLATEY", "MANUAL"]
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{server_url}/api/agent/status",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Status update passed")
            result = response.json()
            print(f"   Response: {result.get('message', 'No message')}")
        elif response.status_code == 401:
            print("❌ Status update failed: 401 Unauthorized")
            print("   This might be due to agent not being registered yet.")
            print("   The server should auto-register agents on first contact.")
            print(f"   Response: {response.text}")
            return False
        else:
            print(f"❌ Status update failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Status update failed: {e}")
        return False
    
    print("-" * 50)
    print("🎉 All tests passed! Agent can connect to server.")
    return True

def main():
    if len(sys.argv) != 4:
        print("Usage: python test_agent.py <agent_id> <api_key> <server_url>")
        print("Example: python test_agent.py test-agent-001 mysecretkey123 http://localhost:5000")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    api_key = sys.argv[2]
    server_url = sys.argv[3]
    
    success = test_agent_connection(agent_id, api_key, server_url)
    
    if success:
        print("\n🚀 Ready to run the full agent!")
        print(f"Run: python remote_agent.py {agent_id} {api_key} {server_url}")
    else:
        print("\n❌ Connection test failed. Please check:")
        print("1. Server is running")
        print("2. Server URL is correct")
        print("3. Network connectivity")
        print("4. Firewall settings")
        sys.exit(1)

if __name__ == "__main__":
    main()
