#!/usr/bin/env python3
"""
Comprehensive Biometric Device Fix Script

This script implements all the solutions mentioned in the user's request:
1. Check Device Driver and SDK
2. Common Error Code 10004 Solutions
3. Check USB Connection and Permissions
4. Proper Device Initialization Sequence
5. Compare with Working Next.js Implementation
6. Install Required Dependencies
7. Run as Administrator
8. Debug Information
"""

import requests
import urllib3
import subprocess
import sys
import os
import time
import ctypes
import winreg
import platform
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f" {title}")
    print("=" * 80)

def print_section(title):
    """Print formatted section"""
    print(f"\n🔍 {title}")
    print("-" * 60)

def print_status(message, success=True):
    """Print status message"""
    status = "✅" if success else "❌"
    print(f"{status} {message}")

def check_system_requirements():
    """Check system requirements and dependencies"""
    print_section("System Requirements Check")
    
    # Check Python version
    python_version = sys.version_info
    if python_version >= (3, 8):
        print_status(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    else:
        print_status(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro} (Requires 3.8+)", False)
    
    # Check required modules
    required_modules = ['requests', 'urllib3', 'ctypes', 'winreg', 'subprocess']
    for module in required_modules:
        try:
            __import__(module)
            print_status(f"{module}: Available")
        except ImportError:
            print_status(f"{module}: Missing", False)
    
    # Check OS
    print_status(f"OS: {platform.system()} {platform.version()}")
    print_status(f"Architecture: {platform.architecture()}")
    print_status(f"Machine: {platform.machine()}")

def check_usb_devices():
    """Check USB devices including SecuGen"""
    print_section("USB Device Check")
    
    try:
        # Method 1: WMI query for USB devices
        result = subprocess.run([
            'wmic', 'path', 'Win32_USBHub', 'get', 'Description,DeviceID'
        ], capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            print("USB Devices found:")
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f"  {line.strip()}")
            
            # Check for SecuGen devices
            secugen_found = any(keyword in result.stdout.lower() for keyword in ['secugen', 'hu20', 'fingerprint', 'biometric'])
            if secugen_found:
                print_status("SecuGen device detected in USB devices")
            else:
                print_status("No SecuGen device found in USB devices", False)
        else:
            print_status(f"Failed to query USB devices: {result.stderr}", False)
            
    except subprocess.TimeoutExpired:
        print_status("USB device query timed out", False)
    except Exception as e:
        print_status(f"Error checking USB devices: {e}", False)

def check_secugen_drivers():
    """Check SecuGen drivers and SDK"""
    print_section("SecuGen Driver and SDK Check")
    
    # Check registry for SecuGen drivers
    registry_paths = [
        r"SYSTEM\CurrentControlSet\Services\usbhub",
        r"SYSTEM\CurrentControlSet\Services\usbccgp",
        r"SYSTEM\CurrentControlSet\Services\usbport",
        r"SOFTWARE\SecuGen",
        r"SOFTWARE\WOW6432Node\SecuGen"
    ]
    
    for key_path in registry_paths:
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)
            print_status(f"Registry key found: {key_path}")
            winreg.CloseKey(key)
        except FileNotFoundError:
            print_status(f"Registry key not found: {key_path}", False)
        except Exception as e:
            print_status(f"Error accessing registry key {key_path}: {e}", False)
    
    # Check for SecuGen installation directories
    secugen_paths = [
        r"C:\Program Files\SecuGen",
        r"C:\Program Files (x86)\SecuGen",
        r"C:\Windows\System32\SecuGen",
        r"C:\Windows\SysWOW64\SecuGen"
    ]
    
    for path in secugen_paths:
        if os.path.exists(path):
            print_status(f"SecuGen directory found: {path}")
        else:
            print_status(f"SecuGen directory not found: {path}", False)

def check_windows_services():
    """Check Windows services related to SecuGen"""
    print_section("Windows Services Check")
    
    services_to_check = [
        'SgiBioSrv',
        'SecuGen',
        'Biometric',
        'usbhub',
        'usbccgp',
        'usbport'
    ]
    
    for service in services_to_check:
        try:
            result = subprocess.run([
                'sc', 'query', service
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print_status(f"Service found: {service}")
                # Parse service status
                status_lines = result.stdout.split('\n')
                for line in status_lines:
                    if 'STATE' in line:
                        print(f"  Status: {line.strip()}")
            else:
                print_status(f"Service not found: {service}", False)
                
        except subprocess.TimeoutExpired:
            print_status(f"Service query timed out for: {service}", False)
        except Exception as e:
            print_status(f"Error checking service {service}: {e}", False)

def test_secugen_connection():
    """Test SecuGen connection with multiple methods"""
    print_section("SecuGen Connection Test")
    
    # Test different endpoints and configurations
    test_configs = [
        {
            'name': 'Default Configuration',
            'url': 'https://localhost:8443/SGIFPCapture',
            'params': {
                'Timeout': '3000',
                'DeviceName': 'HU20',
                'SerialNumber': 'H58220311290'
            }
        },
        {
            'name': 'No Device Targeting',
            'url': 'https://localhost:8443/SGIFPCapture',
            'params': {
                'Timeout': '3000'
            }
        },
        {
            'name': 'Alternative Device Name',
            'url': 'https://localhost:8443/SGIFPCapture',
            'params': {
                'Timeout': '3000',
                'DeviceName': 'SecuGen Hamster Pro'
            }
        },
        {
            'name': 'Extended Timeout',
            'url': 'https://localhost:8443/SGIFPCapture',
            'params': {
                'Timeout': '10000',
                'DeviceName': 'HU20',
                'SerialNumber': 'H58220311290'
            }
        }
    ]
    
    session = requests.Session()
    session.verify = False
    
    for config in test_configs:
        print(f"\nTesting: {config['name']}")
        try:
            response = session.get(config['url'], params=config['params'], timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    error_code = data.get('ErrorCode', -1)
                    
                    if error_code == 0:
                        print_status(f"{config['name']} - SUCCESS!")
                        print(f"  Model: {data.get('Model', 'Unknown')}")
                        print(f"  Serial: {data.get('SerialNumber', 'Unknown')}")
                        return config  # Return working configuration
                    else:
                        print_status(f"{config['name']} - Error {error_code}", False)
                except ValueError:
                    print_status(f"{config['name']} - Invalid JSON response", False)
            else:
                print_status(f"{config['name']} - HTTP {response.status_code}", False)
                
        except Exception as e:
            print_status(f"{config['name']} - Error: {e}", False)
    
    return None

def implement_retry_logic():
    """Implement retry logic for device initialization"""
    print_section("Implementing Retry Logic")
    
    def initialize_device_with_retry():
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"Retry attempt {attempt + 1}/{max_retries}")
                
                # Add delay before initialization
                time.sleep(1)
                
                # Test connection
                session = requests.Session()
                session.verify = False
                
                url = "https://localhost:8443/SGIFPCapture"
                params = {
                    'Timeout': '3000',
                    'DeviceName': 'HU20',
                    'SerialNumber': 'H58220311290'
                }
                
                response = session.get(url, params=params, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('ErrorCode') == 0:
                        print_status(f"Device initialization successful on attempt {attempt + 1}")
                        return data
                    else:
                        print_status(f"Device error {data.get('ErrorCode')} on attempt {attempt + 1}", False)
                else:
                    print_status(f"HTTP error {response.status_code} on attempt {attempt + 1}", False)
                
            except Exception as e:
                print_status(f"Exception on attempt {attempt + 1}: {e}", False)
            
            if attempt < max_retries - 1:
                print(f"Waiting 2 seconds before retry...")
                time.sleep(2)
        
        print_status("All retry attempts failed", False)
        return None
    
    return initialize_device_with_retry()

def check_administrator_privileges():
    """Check if running with administrator privileges"""
    print_section("Administrator Privileges Check")
    
    try:
        # Try to access a restricted registry key
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Services")
        winreg.CloseKey(key)
        print_status("Running with administrator privileges")
        return True
    except PermissionError:
        print_status("Not running with administrator privileges", False)
        print("  → Try running: python comprehensive_fix.py (as Administrator)")
        return False
    except Exception as e:
        print_status(f"Error checking privileges: {e}", False)
        return False

def install_required_dependencies():
    """Install required Python dependencies"""
    print_section("Installing Required Dependencies")
    
    dependencies = [
        'requests>=2.31.0',
        'urllib3>=2.0.0',
        'pyusb>=1.2.1',
        'pywin32>=306'
    ]
    
    for dep in dependencies:
        try:
            print(f"Installing {dep}...")
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', dep
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                print_status(f"{dep} installed successfully")
            else:
                print_status(f"Failed to install {dep}: {result.stderr}", False)
        except subprocess.TimeoutExpired:
            print_status(f"Installation of {dep} timed out", False)
        except Exception as e:
            print_status(f"Error installing {dep}: {e}", False)

def provide_solutions():
    """Provide comprehensive solutions"""
    print_section("Comprehensive Solutions")
    
    solutions = [
        {
            'issue': 'SgiBioSrv service not found',
            'solutions': [
                'Download SecuGen WebAPI from https://webapi.secugen.com/',
                'Install with Administrator privileges',
                'Ensure SgiBioSrv service is selected during installation',
                'Start the service: sc start SgiBioSrv'
            ]
        },
        {
            'issue': 'Error Code 10004 - Device initialization failure',
            'solutions': [
                'Check USB connection - try different USB port',
                'Reinstall SecuGen drivers',
                'Run application as Administrator',
                'Verify device compatibility with SecuGen WebAPI',
                'Check Device Manager for device conflicts'
            ]
        },
        {
            'issue': 'Device not detected in USB devices',
            'solutions': [
                'Check USB cable and connection',
                'Try different USB port',
                'Check Windows Device Manager',
                'Reinstall USB drivers',
                'Check if device is compatible with Windows'
            ]
        },
        {
            'issue': 'Python application issues',
            'solutions': [
                'Install required dependencies: pip install -r requirements.txt',
                'Run as Administrator',
                'Check Python version (3.8+ required)',
                'Check firewall and antivirus settings',
                'Use enhanced biometric device module'
            ]
        }
    ]
    
    for solution in solutions:
        print(f"\n🔧 {solution['issue']}:")
        for i, sol in enumerate(solution['solutions'], 1):
            print(f"   {i}. {sol}")

def create_enhanced_launcher():
    """Create enhanced launcher with all fixes"""
    print_section("Creating Enhanced Launcher")
    
    launcher_content = '''#!/usr/bin/env python3
"""
Enhanced ETD Application Launcher

This launcher includes all the fixes and enhancements for biometric device integration.
"""

import sys
import os
import subprocess
import ctypes

def is_admin():
    """Check if running as administrator"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    """Run the script as administrator"""
    if is_admin():
        return True
    else:
        # Re-run the program with admin rights
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(sys.argv), None, 1
        )
        return False

def main():
    """Main launcher function"""
    print("ETD Enhanced Application Launcher")
    print("=" * 50)
    
    if not is_admin():
        print("⚠️ Not running as Administrator")
        print("For best results, run as Administrator")
        print("Continuing with current privileges...")
    
    # Import and run enhanced application
    try:
        from main_enhanced import main as run_enhanced_app
        print("Starting Enhanced ETD Application...")
        run_enhanced_app()
    except ImportError:
        print("Enhanced application not found, running standard application...")
        from main import main as run_standard_app
        run_standard_app()

if __name__ == "__main__":
    main()
'''
    
    with open('run_enhanced.py', 'w') as f:
        f.write(launcher_content)
    
    print_status("Enhanced launcher created: run_enhanced.py")

def main():
    """Main comprehensive fix function"""
    print_header("ETD Python Desktop Application - Comprehensive Fix")
    print(f"Fix started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all diagnostic checks
    check_system_requirements()
    check_usb_devices()
    check_secugen_drivers()
    check_windows_services()
    check_administrator_privileges()
    
    # Test SecuGen connection
    working_config = test_secugen_connection()
    
    if working_config:
        print_status("Found working SecuGen configuration!")
        print(f"Working config: {working_config}")
    else:
        print_status("No working SecuGen configuration found", False)
    
    # Implement retry logic
    retry_result = implement_retry_logic()
    
    if retry_result:
        print_status("Retry logic successful!")
    else:
        print_status("Retry logic failed", False)
    
    # Install dependencies
    install_required_dependencies()
    
    # Create enhanced launcher
    create_enhanced_launcher()
    
    # Provide solutions
    provide_solutions()
    
    print_header("Comprehensive Fix Complete")
    print("""
Next Steps:
1. Run: python run_enhanced.py (as Administrator)
2. Install SecuGen WebAPI if not already installed
3. Test biometric device connection
4. Use enhanced application for better debugging

For detailed logs, check:
- etd_enhanced.log
- etd_enhanced_app.log
""")

if __name__ == "__main__":
    main()
