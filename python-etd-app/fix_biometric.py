#!/usr/bin/env python3
"""
Biometric Device Fix Script

This script attempts to fix common biometric device issues.
"""

import requests
import urllib3
import subprocess
import sys
import os
import time
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def print_status(message, success=True):
    """Print status message"""
    status = "✅" if success else "❌"
    print(f"{status} {message}")

def restart_secugen_service():
    """Attempt to restart SecuGen service"""
    print("\n🔧 Attempting to restart SecuGen service...")
    
    try:
        # Stop service
        print_status("Stopping SgiBioSrv service...")
        result = subprocess.run(
            ['sc', 'stop', 'SgiBioSrv'], 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        if result.returncode == 0:
            print_status("Service stopped successfully")
        else:
            print_status(f"Service stop result: {result.stdout}", False)
        
        # Wait a moment
        time.sleep(2)
        
        # Start service
        print_status("Starting SgiBioSrv service...")
        result = subprocess.run(
            ['sc', 'start', 'SgiBioSrv'], 
            capture_output=True, 
            text=True, 
            timeout=30
        )
        
        if result.returncode == 0:
            print_status("Service started successfully")
        else:
            print_status(f"Service start result: {result.stdout}", False)
        
        # Wait for service to initialize
        print_status("Waiting for service to initialize...")
        time.sleep(5)
        
        return True
        
    except subprocess.TimeoutExpired:
        print_status("Service restart timed out", False)
        return False
    except Exception as e:
        print_status(f"Service restart failed: {e}", False)
        return False

def test_device_with_different_configs():
    """Test device with different configurations"""
    print("\n🔧 Testing device with different configurations...")
    
    configs = [
        {
            'name': 'Original Config',
            'params': {
                'Timeout': '3000',
                'DeviceName': 'HU20',
                'SerialNumber': 'H58220311290'
            }
        },
        {
            'name': 'No Device Targeting',
            'params': {
                'Timeout': '3000'
            }
        },
        {
            'name': 'Extended Timeout',
            'params': {
                'Timeout': '10000',
                'DeviceName': 'HU20',
                'SerialNumber': 'H58220311290'
            }
        },
        {
            'name': 'Alternative Device Name',
            'params': {
                'Timeout': '3000',
                'DeviceName': 'SecuGen Hamster Pro'
            }
        }
    ]
    
    session = requests.Session()
    session.verify = False
    
    for config in configs:
        print(f"\nTesting: {config['name']}")
        try:
            url = "https://localhost:8443/SGIFPCapture"
            response = session.get(url, params=config['params'], timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                error_code = data.get('ErrorCode', -1)
                
                if error_code == 0:
                    print_status(f"{config['name']} - SUCCESS! Device working")
                    print(f"   Model: {data.get('Model', 'Unknown')}")
                    print(f"   Serial: {data.get('SerialNumber', 'Unknown')}")
                    return config['params']  # Return working config
                else:
                    print_status(f"{config['name']} - Error {error_code}", False)
            else:
                print_status(f"{config['name']} - HTTP {response.status_code}", False)
                
        except Exception as e:
            print_status(f"{config['name']} - Exception: {e}", False)
    
    return None

def update_config_file(working_config):
    """Update configuration file with working settings"""
    if not working_config:
        return False
    
    print(f"\n🔧 Updating configuration with working settings...")
    print(f"Working config: {working_config}")
    
    # Update the biometric_device.py to use the working config
    try:
        # Read current config
        with open('config.py', 'r') as f:
            content = f.read()
        
        # Update device name if different
        if 'DeviceName' in working_config:
            new_device_name = working_config['DeviceName']
            content = content.replace(
                'BIOMETRIC_DEVICE_NAME = "HU20"',
                f'BIOMETRIC_DEVICE_NAME = "{new_device_name}"'
            )
        
        # Update serial number if different
        if 'SerialNumber' in working_config:
            new_serial = working_config['SerialNumber']
            content = content.replace(
                'BIOMETRIC_SERIAL_NUMBER = "H58220311290"',
                f'BIOMETRIC_SERIAL_NUMBER = "{new_serial}"'
            )
        
        # Write updated config
        with open('config.py', 'w') as f:
            f.write(content)
        
        print_status("Configuration updated successfully")
        return True
        
    except Exception as e:
        print_status(f"Failed to update config: {e}", False)
        return False

def test_fixed_configuration():
    """Test the application with fixed configuration"""
    print("\n🔧 Testing application with fixed configuration...")
    
    try:
        # Import and test the biometric device
        from biometric_device import BiometricDevice
        
        device = BiometricDevice()
        result = device.test_connection()
        
        if result['success'] and result['data'].get('ErrorCode') == 0:
            print_status("Application test - SUCCESS!")
            data = result['data']
            print(f"   Model: {data.get('Model', 'Unknown')}")
            print(f"   Serial: {data.get('SerialNumber', 'Unknown')}")
            return True
        else:
            print_status(f"Application test failed: {result.get('error', 'Unknown error')}", False)
            return False
            
    except Exception as e:
        print_status(f"Application test failed: {e}", False)
        return False

def main():
    """Main fix function"""
    print("ETD Python Desktop Application - Biometric Device Fix")
    print(f"Fix started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Step 1: Restart SecuGen service
    print("\n📋 Step 1: Restarting SecuGen service...")
    restart_secugen_service()
    
    # Step 2: Test with different configurations
    print("\n📋 Step 2: Testing different device configurations...")
    working_config = test_device_with_different_configs()
    
    if working_config:
        print_status("Found working configuration!")
        
        # Step 3: Update configuration
        print("\n📋 Step 3: Updating configuration...")
        if update_config_file(working_config):
            print_status("Configuration updated")
        else:
            print_status("Configuration update failed", False)
        
        # Step 4: Test application
        print("\n📋 Step 4: Testing application...")
        if test_fixed_configuration():
            print("\n🎉 SUCCESS! Biometric device is now working!")
            print("You can now run: python main.py")
        else:
            print("\n⚠️ Configuration updated but application test failed")
            print("Try running the application again: python main.py")
    else:
        print("\n❌ No working configuration found")
        print("\nTroubleshooting steps:")
        print("1. Check if SecuGen WebAPI is properly installed")
        print("2. Verify USB device connection")
        print("3. Check Device Manager for device conflicts")
        print("4. Try running as Administrator")
        print("5. Run: python diagnose_biometric.py for detailed diagnostics")

if __name__ == "__main__":
    main()
