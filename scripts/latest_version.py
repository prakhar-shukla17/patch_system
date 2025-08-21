# -*- coding: utf-8 -*-
import subprocess
import json
import sys
import os

# Set UTF-8 encoding for Windows console output
if os.name == 'nt':  # Windows
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def get_installed_apps():
    """Fetch installed apps using winget list"""
    try:
        result = subprocess.run(
            ["winget", "list"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print("Error fetching installed apps:", e)
        return None

def get_upgradable_apps():
    """Fetch apps with available updates using winget upgrade"""
    try:
        result = subprocess.run(
            ["winget", "upgrade"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print("Error fetching upgradable apps:", e)
        return None

def parse_winget_upgrade_output(output):
    """Parse winget upgrade output into a structured list of dicts"""
    lines = output.strip().splitlines()
    if len(lines) < 3:
        return []
    
    # Find the header line (contains "Name", "Id", "Version", etc.)
    header_line = None
    data_start_index = 0
    
    for i, line in enumerate(lines):
        if "Name" in line and "Id" in line and "Version" in line:
            header_line = line
            data_start_index = i + 2  # Skip header and separator line
            break
    
    if header_line is None:
        return []
    
    # Find column positions based on header
    name_start = header_line.find("Name")
    id_start = header_line.find("Id")
    version_start = header_line.find("Version")
    available_start = header_line.find("Available")
    source_start = header_line.find("Source")
    
    apps = []
    current_app = None
    
    for line in lines[data_start_index:]:
        if not line.strip() or line.startswith("-"):
            continue
        
        # Check if this line starts a new app entry (has content at name_start position)
        if len(line) > name_start and line[name_start] != ' ':
            # Save previous app if it exists
            if current_app and current_app.get("name") and current_app.get("current_version"):
                apps.append(current_app)
            
            # Start new app entry
            name = line[name_start:id_start].strip() if id_start > name_start else line[name_start:].strip()
            app_id = line[id_start:version_start].strip() if version_start > id_start else ""
            current_version = line[version_start:available_start].strip() if available_start > version_start else ""
            available_version = line[available_start:source_start].strip() if source_start > available_start else line[available_start:].strip()
            
            # Clean up special characters and encoding issues
            name = name.encode('ascii', 'ignore').decode('ascii').strip()
            app_id = app_id.encode('ascii', 'ignore').decode('ascii').strip()
            current_version = current_version.encode('ascii', 'ignore').decode('ascii').strip()
            available_version = available_version.encode('ascii', 'ignore').decode('ascii').strip()
            
            # Remove extra whitespace and clean up version strings
            current_version = ' '.join(current_version.split())
            available_version = ' '.join(available_version.split())
            
            current_app = {
                "name": name,
                "id": app_id,
                "current_version": current_version,
                "available_version": available_version
            }
        else:
            # This might be a continuation line, skip for now
            continue
    
    # Don't forget the last app
    if current_app and current_app.get("name") and current_app.get("current_version"):
        apps.append(current_app)
    
    # Filter out apps with invalid data and clean up versions
    valid_apps = []
    for app in apps:
        if (app.get("name") and 
            app.get("current_version") and 
            app.get("available_version") and
            len(app["name"]) > 1):
            
            # Additional cleanup for version strings
            current_ver = app["current_version"].replace('¦', '').strip()
            available_ver = app["available_version"].replace('¦', '').strip()
            
            # Clean up current version
            current_parts = current_ver.split()
            if current_parts:
                for part in current_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        current_ver = part
                        break
                else:
                    current_ver = current_parts[0] if current_parts else "Unknown"
            
            # Clean up available version
            available_parts = available_ver.split()
            if available_parts:
                for part in available_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        available_ver = part
                        break
                else:
                    available_ver = available_parts[0] if available_parts else "Unknown"
            
            app["current_version"] = current_ver
            app["available_version"] = available_ver
            valid_apps.append(app)
    
    return valid_apps

def parse_winget_list_output(output):
    """Parse winget list output into a structured list of dicts"""
    lines = output.strip().splitlines()
    if len(lines) < 3:
        return []
    
    # Find the header line (contains "Name", "Id", "Version", etc.)
    header_line = None
    data_start_index = 0
    
    for i, line in enumerate(lines):
        if "Name" in line and "Id" in line and "Version" in line:
            header_line = line
            data_start_index = i + 2  # Skip header and separator line
            break
    
    if header_line is None:
        return []
    
    # Find column positions based on header
    name_start = header_line.find("Name")
    id_start = header_line.find("Id")
    version_start = header_line.find("Version")
    source_start = header_line.find("Source")
    
    apps = []
    current_app = None
    
    for line in lines[data_start_index:]:
        if not line.strip() or line.startswith("-"):
            continue
        
        # Check if this line starts a new app entry (has content at name_start position)
        if len(line) > name_start and line[name_start] != ' ':
            # Save previous app if it exists
            if current_app and current_app.get("name") and current_app.get("current_version"):
                apps.append(current_app)
            
            # Start new app entry
            name = line[name_start:id_start].strip() if id_start > name_start else line[name_start:].strip()
            app_id = line[id_start:version_start].strip() if version_start > id_start else ""
            current_version = line[version_start:source_start].strip() if source_start > version_start else line[version_start:].strip()
            
            # Clean up special characters and encoding issues
            name = name.encode('ascii', 'ignore').decode('ascii').strip()
            app_id = app_id.encode('ascii', 'ignore').decode('ascii').strip()
            current_version = current_version.encode('ascii', 'ignore').decode('ascii').strip()
            
            # Remove extra whitespace and clean up version string
            current_version = ' '.join(current_version.split())
            
            current_app = {
                "name": name,
                "id": app_id,
                "current_version": current_version
            }
        else:
            # This might be a continuation line, skip for now
            continue
    
    # Don't forget the last app
    if current_app and current_app.get("name") and current_app.get("current_version"):
        apps.append(current_app)
    
    # Filter out apps with invalid data and clean up versions
    valid_apps = []
    for app in apps:
        if (app.get("name") and 
            app.get("current_version") and
            len(app["name"]) > 1):
            
            # Additional cleanup for version strings
            version = app["current_version"]
            # Remove common artifacts and clean up
            version = version.replace('¦', '').strip()
            # If version contains multiple parts separated by spaces, take the first valid one
            version_parts = version.split()
            if version_parts:
                # Find the first part that looks like a version (contains dots or numbers)
                for part in version_parts:
                    if '.' in part or part.replace('.', '').replace('-', '').isdigit():
                        version = part
                        break
                else:
                    version = version_parts[0] if version_parts else "Unknown"
            
            app["current_version"] = version
            valid_apps.append(app)
    
    return valid_apps

def merge_installed_with_upgradable(installed_apps, upgradable_apps):
    """Merge installed apps with available updates to show latest versions"""
    # Create a lookup dictionary for upgradable apps by ID
    upgrade_lookup = {}
    for app in upgradable_apps:
        if app.get("id"):
            upgrade_lookup[app["id"]] = app
    
    # Merge the data
    apps_with_latest = []
    for app in installed_apps:
        app_id = app.get("id", "")
        
        if app_id in upgrade_lookup:
            # This app has an update available
            upgrade_info = upgrade_lookup[app_id]
            current_ver = app["current_version"]
            latest_ver = upgrade_info["available_version"]
            
            # Double-check if versions are actually different
            update_needed = current_ver != latest_ver and latest_ver != "Unknown" and current_ver != "Unknown"
            
            apps_with_latest.append({
                **app,
                "latest_version": latest_ver,
                "update_available": update_needed
            })
        else:
            # This app is up to date (or not available for update)
            apps_with_latest.append({
                **app,
                "latest_version": app["current_version"],  # Assume current is latest
                "update_available": False
            })
    
    return apps_with_latest

def main():
    # Fetch installed apps
    installed = get_installed_apps()
    if not installed:
        # Output empty JSON array if failed
        print(json.dumps([]))
        return
        
    all_apps = parse_winget_list_output(installed)
    if not all_apps:
        # Output empty JSON array if failed
        print(json.dumps([]))
        return
    
    # Check for updates
    upgradable = get_upgradable_apps()
    if not upgradable:
        # Output apps without update info if failed
        apps_with_latest = []
        for app in all_apps:
            apps_with_latest.append({
                **app,
                "latest_version": app["current_version"],
                "update_available": False
            })
        print(json.dumps(apps_with_latest, indent=2))
        return
        
    outdated_apps = parse_winget_upgrade_output(upgradable)
    
    # Merge installed apps with update information
    apps_with_latest = merge_installed_with_upgradable(all_apps, outdated_apps)
    
    # Output only the JSON data to stdout
    print(json.dumps(apps_with_latest, indent=2))

if __name__ == "__main__":
    main()
