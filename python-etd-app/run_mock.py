#!/usr/bin/env python3
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
    print("Running ETD Application in Mock Mode")
    print("(Biometric device is simulated)")
    main()
