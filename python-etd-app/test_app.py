#!/usr/bin/env python3
"""
Test script for ETD Python Desktop Application

This script tests the core functionality of the application.
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch
import json

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from biometric_device import BiometricDevice, BiometricDeviceError
from config import Config, get_config

class TestBiometricDevice(unittest.TestCase):
    """Test cases for BiometricDevice class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.device = BiometricDevice()
    
    def test_initialization(self):
        """Test device initialization"""
        self.assertIsNotNone(self.device)
        self.assertIsNotNone(self.device.session)
        self.assertEqual(self.device.biometric_config['device_name'], 'HU20')
    
    @patch('requests.Session.get')
    def test_test_connection_success(self, mock_get):
        """Test successful connection test"""
        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {
            'ErrorCode': 0,
            'Model': 'HU20',
            'SerialNumber': 'H58220311290',
            'Manufacturer': 'SecuGen'
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.device.test_connection()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['ErrorCode'], 0)
        self.assertIsNone(result['error'])
    
    @patch('requests.Session.get')
    def test_test_connection_device_error(self, mock_get):
        """Test connection with device error"""
        # Mock device error response
        mock_response = Mock()
        mock_response.json.return_value = {
            'ErrorCode': 10004,
            'Model': None,
            'SerialNumber': None
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.device.test_connection()
        
        self.assertFalse(result['success'])
        self.assertIn('Device error', result['error'])
    
    @patch('requests.Session.get')
    def test_capture_fingerprint_success(self, mock_get):
        """Test successful fingerprint capture"""
        # Mock successful capture response
        mock_response = Mock()
        mock_response.json.return_value = {
            'ErrorCode': 0,
            'Template': 'base64_encoded_template_data',
            'ImageQuality': 95,
            'NFIQ': 2
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.device.capture_fingerprint()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['ErrorCode'], 0)
        self.assertIsNotNone(result['data']['Template'])
    
    def test_get_error_message(self):
        """Test error message retrieval"""
        self.assertEqual(self.device._get_error_message(10001), "No device found")
        self.assertEqual(self.device._get_error_message(10004), "Device error - check connection")
        self.assertEqual(self.device._get_error_message(99999), "Unknown error code: 99999")
    
    def test_get_capture_quality(self):
        """Test capture quality extraction"""
        data = {
            'Template': 'test_template',
            'ImageQuality': 90,
            'NFIQ': 3,
            'ErrorCode': 0
        }
        
        quality = self.device.get_capture_quality(data)
        
        self.assertEqual(quality['image_quality'], 90)
        self.assertEqual(quality['nfiq'], 3)
        self.assertEqual(quality['template_length'], len('test_template'))
        self.assertEqual(quality['error_code'], 0)

class TestConfig(unittest.TestCase):
    """Test cases for configuration"""
    
    def test_config_initialization(self):
        """Test configuration initialization"""
        config = Config()
        
        self.assertEqual(config.APP_NAME, "ETD Desktop Application")
        self.assertEqual(config.APP_VERSION, "1.0.0")
        self.assertIn('citizen_id', config.REQUIRED_FIELDS)
        self.assertIn('height', config.OPTIONAL_FIELDS)
    
    def test_get_biometric_config(self):
        """Test biometric configuration retrieval"""
        config = Config()
        biometric_config = config.get_biometric_config()
        
        self.assertEqual(biometric_config['base_url'], "https://localhost:8443")
        self.assertEqual(biometric_config['device_name'], "HU20")
        self.assertEqual(biometric_config['serial_number'], "H58220311290")
    
    def test_get_config(self):
        """Test configuration factory"""
        config = get_config()
        self.assertIsInstance(config, Config)

class TestApplicationIntegration(unittest.TestCase):
    """Integration tests for the application"""
    
    def test_imports(self):
        """Test that all modules can be imported"""
        try:
            import main
            import config
            import biometric_device
            self.assertTrue(True)
        except ImportError as e:
            self.fail(f"Failed to import modules: {e}")
    
    def test_config_consistency(self):
        """Test configuration consistency"""
        config = get_config()
        
        # Check that required fields are defined
        self.assertGreater(len(config.REQUIRED_FIELDS), 0)
        self.assertGreater(len(config.OPTIONAL_FIELDS), 0)
        
        # Check that biometric config is valid
        biometric_config = config.get_biometric_config()
        self.assertIn('base_url', biometric_config)
        self.assertIn('device_name', biometric_config)
        self.assertIn('serial_number', biometric_config)

def run_tests():
    """Run all tests"""
    print("Running ETD Desktop Application Tests...")
    print("=" * 50)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestBiometricDevice))
    suite.addTests(loader.loadTestsFromTestCase(TestConfig))
    suite.addTests(loader.loadTestsFromTestCase(TestApplicationIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    if result.wasSuccessful():
        print("✅ All tests passed!")
        return True
    else:
        print(f"❌ {len(result.failures)} test(s) failed")
        print(f"❌ {len(result.errors)} error(s) occurred")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
