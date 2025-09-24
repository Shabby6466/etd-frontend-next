#!/usr/bin/env python3
"""
Biometric Device Diagnostic Tool

This script helps diagnose and fix biometric device connection issues.
"""

import requests
import urllib3
import ssl
import socket
import subprocess
import sys
import os
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def print_section(title):
    """Print formatted section"""
    print(f"\n🔍 {title}")
    print("-" * 40)

def check_python_environment():
    """Check Python environment"""
    print_section("Python Environment")
    print(f"Python Version: {sys.version}")
    print(f"Python Executable: {sys.executable}")
    print(f"Current Directory: {os.getcwd()}")
    
    # Check required modules
    required_modules = ['requests', 'urllib3', 'ssl', 'socket']
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module}: Available")
        except ImportError:
            print(f"❌ {module}: Missing")

def check_network_connectivity():
    """Check network connectivity to biometric device"""
    print_section("Network Connectivity")
    
    # Test basic connectivity
    try:
        # Test if localhost:8443 is reachable
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', 8443))
        sock.close()
        
        if result == 0:
            print("✅ localhost:8443 is reachable")
        else:
            print("❌ localhost:8443 is not reachable")
            print("   → Check if SecuGen WebAPI service is running")
            return False
    except Exception as e:
        print(f"❌ Network test failed: {e}")
        return False
    
    return True

def check_secugen_service():
    """Check SecuGen WebAPI service"""
    print_section("SecuGen WebAPI Service")
    
    # Test HTTP connection
    try:
        session = requests.Session()
        session.verify = False
        
        # Test basic endpoint
        url = "https://localhost:8443/SGIFPCapture"
        params = {'Timeout': '3000'}
        
        print(f"Testing endpoint: {url}")
        response = session.get(url, params=params, timeout=5)
        
        print(f"HTTP Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ SecuGen WebAPI service is responding")
            try:
                data = response.json()
                print(f"Response Data: {data}")
                return data
            except ValueError:
                print("⚠️ Service responding but invalid JSON")
                print(f"Raw Response: {response.text}")
                return None
        else:
            print(f"❌ Service returned status {response.status_code}")
            return None
            
    except requests.exceptions.SSLError as e:
        print(f"❌ SSL Error: {e}")
        print("   → This is normal for localhost with self-signed certificates")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
        print("   → Check if SecuGen WebAPI service is running")
        return None
    except requests.exceptions.Timeout as e:
        print(f"❌ Timeout Error: {e}")
        print("   → Service may be slow to respond")
        return None
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None

def check_device_detection():
    """Check if biometric device is detected"""
    print_section("Device Detection")
    
    # Test with different device parameters
    test_configs = [
        {
            'name': 'Default Configuration',
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
            'name': 'Alternative Device Name',
            'params': {
                'Timeout': '3000',
                'DeviceName': 'SecuGen Hamster Pro'
            }
        }
    ]
    
    session = requests.Session()
    session.verify = False
    
    for config in test_configs:
        print(f"\nTesting: {config['name']}")
        try:
            url = "https://localhost:8443/SGIFPCapture"
            response = session.get(url, params=config['params'], timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                error_code = data.get('ErrorCode', -1)
                model = data.get('Model', 'Unknown')
                serial = data.get('SerialNumber', 'Unknown')
                
                print(f"  Error Code: {error_code}")
                print(f"  Model: {model}")
                print(f"  Serial: {serial}")
                
                if error_code == 0:
                    print(f"  ✅ {config['name']} - Device detected successfully!")
                    return data
                else:
                    print(f"  ❌ {config['name']} - Device error (code {error_code})")
            else:
                print(f"  ❌ {config['name']} - HTTP {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {config['name']} - Error: {e}")
    
    return None

def check_windows_services():
    """Check Windows services related to SecuGen"""
    print_section("Windows Services")
    
    try:
        # Check for SecuGen services
        result = subprocess.run(
            ['sc', 'query', 'SgiBioSrv'], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        
        if result.returncode == 0:
            print("✅ SgiBioSrv service found")
            print(f"Service Status:\n{result.stdout}")
        else:
            print("❌ SgiBioSrv service not found")
            print("   → Install SecuGen WebAPI from https://webapi.secugen.com/")
            
    except subprocess.TimeoutExpired:
        print("⚠️ Service check timed out")
    except FileNotFoundError:
        print("⚠️ 'sc' command not available (not Windows or different shell)")
    except Exception as e:
        print(f"❌ Service check failed: {e}")

def check_device_manager():
    """Check Windows Device Manager for biometric devices"""
    print_section("Device Manager Check")
    
    try:
        # Try to get device information
        result = subprocess.run(
            ['powershell', '-Command', 
             'Get-PnpDevice | Where-Object {$_.FriendlyName -like "*SecuGen*" -or $_.FriendlyName -like "*Fingerprint*" -or $_.FriendlyName -like "*Biometric*"} | Select-Object FriendlyName, Status, InstanceId'],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print("✅ Biometric devices found in Device Manager:")
            print(result.stdout)
        else:
            print("❌ No biometric devices found in Device Manager")
            print("   → Check USB connection and drivers")
            
    except subprocess.TimeoutExpired:
        print("⚠️ Device Manager check timed out")
    except Exception as e:
        print(f"❌ Device Manager check failed: {e}")

def provide_solutions():
    """Provide solutions for common issues"""
    print_section("Solutions and Next Steps")
    
    solutions = [
        {
            'issue': 'SecuGen WebAPI not running',
            'solutions': [
                'Download and install SecuGen WebAPI from https://webapi.secugen.com/',
                'Start the SgiBioSrv service: services.msc → SgiBioSrv → Start',
                'Run as Administrator if needed'
            ]
        },
        {
            'issue': 'Device not detected (Error 10004)',
            'solutions': [
                'Check USB connection - try different USB port',
                'Check Device Manager for device conflicts',
                'Reinstall SecuGen drivers',
                'Try running application as Administrator',
                'Verify device is compatible with SecuGen WebAPI'
            ]
        },
        {
            'issue': 'SSL Certificate errors',
            'solutions': [
                'This is normal for localhost with self-signed certificates',
                'Application disables SSL verification for localhost',
                'Check if SecuGen WebAPI SSL configuration is correct'
            ]
        },
        {
            'issue': 'Python application issues',
            'solutions': [
                'Ensure all dependencies are installed: pip install -r requirements.txt',
                'Check Python version (3.8+ required)',
                'Run with administrator privileges',
                'Check firewall settings'
            ]
        }
    ]
    
    for solution in solutions:
        print(f"\n🔧 {solution['issue']}:")
        for i, sol in enumerate(solution['solutions'], 1):
            print(f"   {i}. {sol}")

def test_alternative_endpoints():
    """Test alternative SecuGen endpoints"""
    print_section("Alternative Endpoints")
    
    endpoints = [
        "https://localhost:8443/SGIFPCapture",
        "https://127.0.0.1:8443/SGIFPCapture", 
        "http://localhost:8443/SGIFPCapture",
        "http://127.0.0.1:8443/SGIFPCapture"
    ]
    
    session = requests.Session()
    session.verify = False
    
    for endpoint in endpoints:
        try:
            print(f"Testing: {endpoint}")
            response = session.get(endpoint, params={'Timeout': '3000'}, timeout=5)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"  Response: {data}")
                except ValueError:
                    print(f"  Raw Response: {response.text[:100]}...")
            else:
                print(f"  Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"  Error: {e}")

def main():
    """Main diagnostic function"""
    print_header("ETD Python Desktop Application - Biometric Device Diagnostic")
    print(f"Diagnostic started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all diagnostic checks
    check_python_environment()
    
    if check_network_connectivity():
        service_data = check_secugen_service()
        
        if service_data:
            device_data = check_device_detection()
            if device_data and device_data.get('ErrorCode') == 0:
                print("\n🎉 SUCCESS: Biometric device is working correctly!")
                print(f"   Model: {device_data.get('Model', 'Unknown')}")
                print(f"   Serial: {device_data.get('SerialNumber', 'Unknown')}")
            else:
                print("\n⚠️ SecuGen service is running but device has issues")
                check_windows_services()
                check_device_manager()
        else:
            print("\n❌ SecuGen WebAPI service is not responding")
            check_windows_services()
    else:
        print("\n❌ Cannot connect to localhost:8443")
        print("   → SecuGen WebAPI service is not running")
    
    # Test alternative endpoints
    test_alternative_endpoints()
    
    # Provide solutions
    provide_solutions()
    
    print_header("Diagnostic Complete")
    print("""
If the diagnostic shows issues:
1. Install/restart SecuGen WebAPI service
2. Check USB device connection
3. Run application as Administrator
4. Verify device drivers in Device Manager

For more help, see README.md or MIGRATION_GUIDE.md
""")

if __name__ == "__main__":
    main()
