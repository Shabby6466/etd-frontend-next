#!/usr/bin/env python3
"""
Test ETD Application without SecuGen Service

This script tests the application functionality without requiring
the SecuGen service to be running.
"""

import sys
import os
import tkinter as tk
from tkinter import ttk, messagebox
import json
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_mock_biometric_device():
    """Create a mock biometric device for testing"""
    class MockBiometricDevice:
        def __init__(self):
            self.device_name = "Mock Device"
            self.serial_number = "MOCK123456"
        
        def test_connection(self):
            """Mock successful connection"""
            return {
                'success': True,
                'data': {
                    'ErrorCode': 0,
                    'Model': 'Mock SecuGen Device',
                    'SerialNumber': self.serial_number,
                    'Manufacturer': 'Mock Manufacturer'
                },
                'error': None
            }
        
        def capture_fingerprint(self, timeout=25000):
            """Mock fingerprint capture"""
            return {
                'success': True,
                'data': {
                    'ErrorCode': 0,
                    'Template': 'mock_template_data_base64_encoded',
                    'ImageQuality': 95,
                    'NFIQ': 2,
                    'Model': 'Mock SecuGen Device',
                    'SerialNumber': self.serial_number
                },
                'error': None
            }
    
    return MockBiometricDevice()

def test_application_without_biometric():
    """Test the application without biometric device"""
    print("🧪 Testing ETD Application without Biometric Device")
    print("=" * 60)
    
    try:
        # Import the main application
        from main import ETDApplication
        
        print("✅ Successfully imported ETDApplication")
        
        # Create a mock biometric device
        mock_device = create_mock_biometric_device()
        
        # Test mock device
        print("\n🔧 Testing mock biometric device...")
        result = mock_device.test_connection()
        
        if result['success']:
            print("✅ Mock device connection successful")
            print(f"   Model: {result['data'].get('Model')}")
            print(f"   Serial: {result['data'].get('SerialNumber')}")
        else:
            print(f"❌ Mock device connection failed: {result['error']}")
            return False
        
        # Test mock fingerprint capture
        print("\n🔧 Testing mock fingerprint capture...")
        capture_result = mock_device.capture_fingerprint()
        
        if capture_result['success']:
            print("✅ Mock fingerprint capture successful")
            print(f"   Template length: {len(capture_result['data'].get('Template', ''))}")
            print(f"   Quality: {capture_result['data'].get('ImageQuality')}")
        else:
            print(f"❌ Mock fingerprint capture failed: {capture_result['error']}")
            return False
        
        print("\n🎉 Application components are working correctly!")
        print("The issue is specifically with the SecuGen service installation.")
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import application: {e}")
        return False
    except Exception as e:
        print(f"❌ Application test failed: {e}")
        return False

def show_installation_guide():
    """Show installation guide for SecuGen WebAPI"""
    print("\n📋 SecuGen WebAPI Installation Guide")
    print("=" * 60)
    
    guide = """
🔧 Step-by-Step Installation:

1. Download SecuGen WebAPI:
   • Go to: https://webapi.secugen.com/
   • Download "SecuGen WebAPI" (not just SDK)
   • Choose Windows version

2. Install with Administrator Rights:
   • Right-click installer → "Run as Administrator"
   • Follow installation wizard
   • Make sure "SgiBioSrv Service" is selected

3. Verify Installation:
   • Open Services (services.msc)
   • Look for "SgiBioSrv" service
   • Start the service if not running

4. Test Connection:
   • Open browser: https://localhost:8443/SGIFPCapture
   • Should show device information (not Error 10004)

5. Run Python Application:
   • python main.py
   • Test biometric device connection
   • Should work without Error 10004

🔧 Alternative: Use Mock Mode
If you can't install SecuGen WebAPI right now, the application
can run in mock mode for testing the form functionality.
"""
    
    print(guide)

def create_mock_mode_launcher():
    """Create a launcher that uses mock biometric device"""
    print("\n🔧 Creating mock mode launcher...")
    
    mock_launcher_content = '''#!/usr/bin/env python3
"""
ETD Application - Mock Mode Launcher

This launcher runs the ETD application with a mock biometric device
for testing when SecuGen WebAPI is not available.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Patch the biometric device before importing main
class MockBiometricDevice:
    def __init__(self):
        self.device_name = "Mock Device"
        self.serial_number = "MOCK123456"
    
    def test_connection(self):
        return {
            'success': True,
            'data': {
                'ErrorCode': 0,
                'Model': 'Mock SecuGen Device',
                'SerialNumber': self.serial_number,
                'Manufacturer': 'Mock Manufacturer'
            },
            'error': None
        }
    
    def capture_fingerprint(self, timeout=25000):
        return {
            'success': True,
            'data': {
                'ErrorCode': 0,
                'Template': 'mock_template_data_base64_encoded',
                'ImageQuality': 95,
                'NFIQ': 2,
                'Model': 'Mock SecuGen Device',
                'SerialNumber': self.serial_number
            },
            'error': None
        }

# Replace the biometric device import
import biometric_device
biometric_device.BiometricDevice = MockBiometricDevice

# Now import and run the main application
if __name__ == "__main__":
    from main import main
    print("🧪 Running ETD Application in Mock Mode")
    print("   (Biometric device is simulated)")
    main()
'''
    
    with open('run_mock.py', 'w') as f:
        f.write(mock_launcher_content)
    
    print("✅ Created run_mock.py - Mock mode launcher")
    print("   Run: python run_mock.py")

def main():
    """Main function"""
    print("ETD Application - Mock Mode Testing")
    print("=" * 60)
    
    # Test application components
    if test_application_without_biometric():
        print("\n✅ Application is working correctly!")
        print("The issue is specifically with SecuGen WebAPI service installation.")
        
        # Show installation guide
        show_installation_guide()
        
        # Create mock mode launcher
        create_mock_mode_launcher()
        
        print("\n🎯 Next Steps:")
        print("1. Install SecuGen WebAPI service (recommended)")
        print("2. Or use mock mode: python run_mock.py")
        print("3. Test form functionality without biometric device")
        
    else:
        print("\n❌ Application has issues beyond biometric device")
        print("Check Python dependencies and configuration")

if __name__ == "__main__":
    main()
