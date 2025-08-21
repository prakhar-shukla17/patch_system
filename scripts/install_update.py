#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import json
import sys
import os

def install_app_update(app_id):
    """Install or upgrade a specific app using winget"""
    try:
        print(f"Attempting to install/upgrade: {app_id}")
        
        # First try to install (if not installed)
        try:
            print(f"Trying to install {app_id}...")
            result = subprocess.run(
                ["winget", "install", "--id", app_id, "--accept-source-agreements", "--accept-package-agreements"],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"Install successful: {result.stdout}")
            return {
                "success": True,
                "message": f"Successfully installed {app_id}",
                "output": result.stdout
            }
        except subprocess.CalledProcessError as install_error:
            print(f"Install failed, trying upgrade: {install_error.stderr}")
            
            # If install fails, try upgrade (if already installed)
            try:
                print(f"Trying to upgrade {app_id}...")
                result = subprocess.run(
                    ["winget", "upgrade", "--id", app_id, "--accept-source-agreements", "--accept-package-agreements"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                print(f"Upgrade successful: {result.stdout}")
                return {
                    "success": True,
                    "message": f"Successfully upgraded {app_id}",
                    "output": result.stdout
                }
            except subprocess.CalledProcessError as upgrade_error:
                print(f"Upgrade also failed: {upgrade_error.stderr}")
                
                # If both fail, try with --name flag
                try:
                    print(f"Trying with --name flag: {app_id}")
                    result = subprocess.run(
                        ["winget", "install", "--name", app_id, "--accept-source-agreements", "--accept-package-agreements"],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    print(f"Install with name successful: {result.stdout}")
                    return {
                        "success": True,
                        "message": f"Successfully installed {app_id} by name",
                        "output": result.stdout
                    }
                except subprocess.CalledProcessError as name_error:
                    print(f"All installation methods failed for {app_id}")
                    return {
                        "success": False,
                        "error": f"Failed to install/upgrade {app_id}",
                        "details": f"Install: {install_error.stderr}, Upgrade: {upgrade_error.stderr}, Name: {name_error.stderr}"
                    }
                    
    except Exception as e:
        error_msg = f"Unexpected error installing/upgrading {app_id}: {str(e)}"
        print(error_msg)
        return {
            "success": False,
            "error": error_msg,
            "details": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "error": "App ID is required"
        }))
        return
    
    app_id = sys.argv[1]
    result = install_app_update(app_id)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
