#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify installation functionality
"""

import subprocess
import json
import sys
import os

def test_installation(app_id):
    """Test installation of a specific app"""
    
    print(f"🧪 Testing Installation for: {app_id}")
    print("-" * 50)
    
    # Test 1: Check if winget is available
    print("1. Checking winget availability...")
    try:
        result = subprocess.run(["winget", "--version"], capture_output=True, text=True, check=True)
        print(f"✅ Winget is available: {result.stdout.strip()}")
    except Exception as e:
        print(f"❌ Winget not available: {e}")
        return False
    
    # Test 2: Check if app is already installed
    print(f"\n2. Checking if {app_id} is already installed...")
    try:
        result = subprocess.run(
            ["winget", "list", "--id", app_id],
            capture_output=True,
            text=True,
            check=True
        )
        if app_id in result.stdout:
            print(f"✅ {app_id} is already installed")
            print("   Will attempt upgrade instead of install")
        else:
            print(f"ℹ️ {app_id} is not installed")
            print("   Will attempt fresh install")
    except subprocess.CalledProcessError:
        print(f"ℹ️ {app_id} is not installed (or not found)")
        print("   Will attempt fresh install")
    
    # Test 3: Try to install/upgrade the app
    print(f"\n3. Attempting to install/upgrade {app_id}...")
    try:
        # Use our install_update.py script
        script_path = os.path.join(os.path.dirname(__file__), "install_update.py")
        result = subprocess.run(
            ["python", script_path, app_id],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            try:
                output = json.loads(result.stdout)
                if output.get("success"):
                    print(f"✅ Installation successful!")
                    print(f"   Message: {output.get('message', 'No message')}")
                    if output.get('output'):
                        print(f"   Output: {output['output'][:200]}...")
                    return True
                else:
                    print(f"❌ Installation failed!")
                    print(f"   Error: {output.get('error', 'Unknown error')}")
                    if output.get('details'):
                        print(f"   Details: {output['details'][:200]}...")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON output: {result.stdout}")
                return False
        else:
            print(f"❌ Script execution failed!")
            print(f"   Return code: {result.returncode}")
            print(f"   Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"❌ Installation timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_installation.py <app_id>")
        print("Examples:")
        print("  python test_installation.py 7zip.7zip")
        print("  python test_installation.py Notepad++.Notepad++")
        print("  python test_installation.py Google.Chrome")
        sys.exit(1)
    
    app_id = sys.argv[1]
    success = test_installation(app_id)
    
    if success:
        print(f"\n🎉 Installation test passed for {app_id}!")
        print("The installation system is working correctly.")
    else:
        print(f"\n❌ Installation test failed for {app_id}.")
        print("Please check the error messages above.")

if __name__ == "__main__":
    main()



























