#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for web interface endpoints
"""

import requests
import json
import sys

def test_web_interface(server_url):
    """Test the web interface endpoints"""
    
    print("🧪 Testing Web Interface Endpoints")
    print(f"Server URL: {server_url}")
    print("-" * 50)
    
    # Test 1: Start Agent
    print("1. Testing Start Agent...")
    try:
        response = requests.post(
            f"{server_url}/api/agent/start",
            json={
                "agentId": "test-agent-001",
                "apiKey": "mysecretkey123"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Start Agent: SUCCESS")
            print(f"   Message: {result.get('message', 'No message')}")
        else:
            print(f"❌ Start Agent: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Start Agent: ERROR - {e}")
        return False
    
    # Test 2: Get Agents List
    print("\n2. Testing Get Agents...")
    try:
        response = requests.get(
            f"{server_url}/api/agent/agents",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            agents = result.get('data', [])
            print("✅ Get Agents: SUCCESS")
            print(f"   Found {len(agents)} agents")
            for agent in agents:
                print(f"   - {agent.get('id')}: {agent.get('status')}")
        else:
            print(f"❌ Get Agents: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Get Agents: ERROR - {e}")
        return False
    
    # Test 3: Install via Agent
    print("\n3. Testing Install via Agent...")
    try:
        response = requests.post(
            f"{server_url}/api/agent/install",
            json={
                "agentId": "test-agent-001",
                "appName": "Test App",
                "appId": "Test.App",
                "installationMethod": "WINGET"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Install via Agent: SUCCESS")
            print(f"   Message: {result.get('message', 'No message')}")
        else:
            print(f"❌ Install via Agent: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Install via Agent: ERROR - {e}")
        return False
    
    # Test 4: Get Agent Status
    print("\n4. Testing Get Agent Status...")
    try:
        response = requests.get(
            f"{server_url}/api/agent/status?agentId=test-agent-001",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            agent_data = result.get('data', {})
            print("✅ Get Agent Status: SUCCESS")
            print(f"   Status: {agent_data.get('status', 'Unknown')}")
            print(f"   Message: {agent_data.get('lastMessage', 'No message')}")
        else:
            print(f"❌ Get Agent Status: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Get Agent Status: ERROR - {e}")
        return False
    
    print("\n🎉 All tests passed! Web interface is working correctly.")
    return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_web_interface.py <server_url>")
        print("Example: python test_web_interface.py http://localhost:5000")
        sys.exit(1)
    
    server_url = sys.argv[1]
    success = test_web_interface(server_url)
    
    if success:
        print("\n✅ Web interface is ready to use!")
        print("You can now:")
        print("1. Start your backend server")
        print("2. Start your frontend server")
        print("3. Go to the Agents page and click 'Start Agent'")
        print("4. Click any application to install it!")
    else:
        print("\n❌ Some tests failed. Please check your server configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()



























