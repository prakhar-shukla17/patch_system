#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import json
import sys
import os
import re

def get_app_info(app_id):
    """Get detailed information about a specific app using winget show"""
    try:
        # Try with --id flag first
        result = subprocess.run(
            ["winget", "show", "--id", app_id],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        try:
            # If --id fails, try with --name flag
            result = subprocess.run(
                ["winget", "show", "--name", app_id],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            return None

def extract_download_url(app_info):
    """Extract download URL from winget show output"""
    if not app_info:
        return None
    
    lines = app_info.splitlines()
    download_url = None
    
    for line in lines:
        line = line.strip()
        # Look for Homepage or Download URL
        if line.startswith("Homepage:") or line.startswith("Download URL:"):
            url = line.split(":", 1)[1].strip()
            if url and url != "N/A":
                download_url = url
                break
    
    # If no explicit download URL, try to find homepage
    if not download_url:
        for line in lines:
            line = line.strip()
            if line.startswith("Homepage:"):
                url = line.split(":", 1)[1].strip()
                if url and url != "N/A":
                    download_url = url
                    break
    
    return download_url

def get_download_url(app_id):
    """Get download URL for a specific app"""
    try:
        app_info = get_app_info(app_id)
        if app_info:
            download_url = extract_download_url(app_info)
            return {
                "success": True,
                "app_id": app_id,
                "download_url": download_url,
                "message": f"Download URL found for {app_id}" if download_url else f"No download URL found for {app_id}"
            }
        else:
            return {
                "success": False,
                "app_id": app_id,
                "error": f"Could not find app information for {app_id}"
            }
    except Exception as e:
        return {
            "success": False,
            "app_id": app_id,
            "error": f"Error getting download URL for {app_id}: {str(e)}"
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "error": "App ID is required"
        }))
        return
    
    app_id = sys.argv[1]
    result = get_download_url(app_id)
    print(json.dumps(result))

if __name__ == "__main__":
    main()






