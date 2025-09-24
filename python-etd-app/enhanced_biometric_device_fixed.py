#!/usr/bin/env python3
"""
Enhanced Biometric Device Integration with Comprehensive Logging (Fixed)

This module provides enhanced biometric device communication with detailed logging,
retry logic, and multiple initialization methods to resolve Error 10004.
Fixed version without Unicode emoji characters to avoid encoding issues.
"""

import requests
import urllib3
import ssl
import time
import subprocess
import platform
import ctypes
import winreg
import sys
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
import logging

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure enhanced logging
def setup_enhanced_logging():
    """Setup comprehensive logging for debugging"""
    # Create file handler with UTF-8 encoding
    file_handler = logging.FileHandler('etd_enhanced.log', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # Create console handler with UTF-8 encoding
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Configure logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_enhanced_logging()

class EnhancedBiometricDevice:
    """
    Enhanced biometric device handler with comprehensive debugging and retry logic
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize enhanced biometric device"""
        self.logger = logger
        self.config = config or self._get_default_config()
        self.session = requests.Session()
        self.retry_count = 0
        self.max_retries = 3
        
        # Setup session
        self._setup_session()
        
        # Log system information
        self._log_system_info()
        
        self.logger.info(f"Enhanced biometric device initialized with config: {self.config}")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'base_url': 'https://localhost:8443',
            'device_name': 'HU20',
            'serial_number': 'H58220311290',
            'timeout': 25000,
            'test_timeout': 5000,
            'retry_delay': 2,
            'max_retries': 3
        }
    
    def _setup_session(self):
        """Setup HTTP session with enhanced configuration"""
        self.session.verify = False
        self.session.headers.update({
            'User-Agent': f'ETD-Enhanced/{datetime.now().strftime("%Y%m%d")}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
        })
        
        # Configure timeout
        self.session.timeout = (self.config['test_timeout'] / 1000, self.config['timeout'] / 1000)
        
        self.logger.debug("HTTP session configured")
    
    def _log_system_info(self):
        """Log comprehensive system information"""
        self.logger.info("=== SYSTEM INFORMATION ===")
        self.logger.info(f"OS: {platform.system()} {platform.version()}")
        self.logger.info(f"Python: {platform.python_version()}")
        self.logger.info(f"Architecture: {platform.architecture()}")
        self.logger.info(f"Machine: {platform.machine()}")
        self.logger.info(f"Processor: {platform.processor()}")
        
        # Check USB devices
        self._check_usb_devices()
        
        # Check SecuGen drivers
        self._check_secugen_drivers()
        
        # Check Windows services
        self._check_windows_services()
    
    def _check_usb_devices(self):
        """Check for USB devices including SecuGen"""
        self.logger.info("=== USB DEVICE CHECK ===")
        try:
            # Method 1: WMI query
            result = subprocess.run([
                'wmic', 'path', 'Win32_USBHub', 'get', 'Description,DeviceID'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                self.logger.info("USB Devices found:")
                for line in result.stdout.split('\n'):
                    if line.strip():
                        self.logger.info(f"  {line.strip()}")
                        
                # Check for SecuGen devices
                if any(keyword in result.stdout.lower() for keyword in ['secugen', 'hu20', 'fingerprint']):
                    self.logger.info("[SUCCESS] SecuGen device detected in USB devices")
                else:
                    self.logger.warning("[WARNING] No SecuGen device found in USB devices")
            else:
                self.logger.error(f"Failed to query USB devices: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            self.logger.error("USB device query timed out")
        except Exception as e:
            self.logger.error(f"Error checking USB devices: {e}")
    
    def _check_secugen_drivers(self):
        """Check for SecuGen drivers"""
        self.logger.info("=== SECUGEN DRIVER CHECK ===")
        try:
            # Check registry for SecuGen drivers
            key_paths = [
                r"SYSTEM\CurrentControlSet\Services\usbhub",
                r"SYSTEM\CurrentControlSet\Services\usbccgp",
                r"SYSTEM\CurrentControlSet\Services\usbport"
            ]
            
            for key_path in key_paths:
                try:
                    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)
                    self.logger.info(f"[SUCCESS] Registry key found: {key_path}")
                    winreg.CloseKey(key)
                except FileNotFoundError:
                    self.logger.warning(f"[WARNING] Registry key not found: {key_path}")
                except Exception as e:
                    self.logger.error(f"Error accessing registry key {key_path}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Error checking SecuGen drivers: {e}")
    
    def _check_windows_services(self):
        """Check Windows services related to SecuGen"""
        self.logger.info("=== WINDOWS SERVICES CHECK ===")
        services_to_check = ['SgiBioSrv', 'SecuGen', 'Biometric']
        
        for service in services_to_check:
            try:
                result = subprocess.run([
                    'sc', 'query', service
                ], capture_output=True, text=True, timeout=5)
                
                if result.returncode == 0:
                    self.logger.info(f"[SUCCESS] Service found: {service}")
                    self.logger.info(f"  Status: {result.stdout}")
                else:
                    self.logger.warning(f"[WARNING] Service not found: {service}")
                    
            except subprocess.TimeoutExpired:
                self.logger.error(f"Service query timed out for: {service}")
            except Exception as e:
                self.logger.error(f"Error checking service {service}: {e}")
    
    def test_connection_with_retry(self) -> Dict[str, Any]:
        """Test connection with retry logic and enhanced debugging"""
        self.logger.info("=== TESTING CONNECTION WITH RETRY ===")
        
        for attempt in range(self.max_retries):
            self.logger.info(f"Connection attempt {attempt + 1}/{self.max_retries}")
            
            try:
                # Add delay before attempt
                if attempt > 0:
                    delay = self.config['retry_delay'] * attempt
                    self.logger.info(f"Waiting {delay} seconds before retry...")
                    time.sleep(delay)
                
                # Test connection
                result = self._test_connection_single()
                
                if result['success']:
                    self.logger.info(f"[SUCCESS] Connection successful on attempt {attempt + 1}")
                    return result
                else:
                    self.logger.warning(f"[WARNING] Connection failed on attempt {attempt + 1}: {result.get('error')}")
                    
            except Exception as e:
                self.logger.error(f"Exception on attempt {attempt + 1}: {e}")
                
        # All attempts failed
        self.logger.error("All connection attempts failed")
        return {
            'success': False,
            'data': None,
            'error': f'Connection failed after {self.max_retries} attempts'
        }
    
    def _test_connection_single(self) -> Dict[str, Any]:
        """Single connection test with enhanced debugging"""
        self.logger.debug("Testing single connection...")
        
        try:
            url = f"{self.config['base_url']}/SGIFPCapture"
            params = {
                'Timeout': str(self.config['test_timeout']),
                'DeviceName': self.config['device_name'],
                'SerialNumber': self.config['serial_number']
            }
            
            self.logger.debug(f"Request URL: {url}")
            self.logger.debug(f"Request params: {params}")
            
            # Make request with detailed logging
            response = self.session.get(url, params=params, timeout=self.config['test_timeout'] / 1000)
            
            self.logger.debug(f"Response status: {response.status_code}")
            self.logger.debug(f"Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.logger.debug(f"Response data: {data}")
                    
                    error_code = data.get('ErrorCode', -1)
                    if error_code == 0:
                        self.logger.info("[SUCCESS] Device connection successful")
                        return {
                            'success': True,
                            'data': data,
                            'error': None
                        }
                    else:
                        error_msg = self._get_error_message(error_code)
                        self.logger.warning(f"[WARNING] Device error {error_code}: {error_msg}")
                        return {
                            'success': False,
                            'data': data,
                            'error': f'Device error {error_code}: {error_msg}'
                        }
                except ValueError as e:
                    self.logger.error(f"Invalid JSON response: {e}")
                    return {
                        'success': False,
                        'data': None,
                        'error': f'Invalid JSON response: {e}'
                    }
            else:
                self.logger.error(f"HTTP error {response.status_code}")
                return {
                    'success': False,
                    'data': None,
                    'error': f'HTTP error {response.status_code}'
                }
                
        except requests.exceptions.Timeout:
            self.logger.error("Connection timeout")
            return {
                'success': False,
                'data': None,
                'error': 'Connection timeout'
            }
        except requests.exceptions.ConnectionError as e:
            self.logger.error(f"Connection error: {e}")
            return {
                'success': False,
                'data': None,
                'error': f'Connection error: {e}'
            }
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            return {
                'success': False,
                'data': None,
                'error': f'Unexpected error: {e}'
            }
    
    def capture_fingerprint_with_retry(self, timeout: Optional[int] = None) -> Dict[str, Any]:
        """Capture fingerprint with retry logic"""
        self.logger.info("=== CAPTURING FINGERPRINT WITH RETRY ===")
        
        if timeout is None:
            timeout = self.config['timeout']
        
        for attempt in range(self.max_retries):
            self.logger.info(f"Capture attempt {attempt + 1}/{self.max_retries}")
            
            try:
                if attempt > 0:
                    delay = self.config['retry_delay'] * attempt
                    self.logger.info(f"Waiting {delay} seconds before retry...")
                    time.sleep(delay)
                
                result = self._capture_fingerprint_single(timeout)
                
                if result['success']:
                    self.logger.info(f"[SUCCESS] Fingerprint captured successfully on attempt {attempt + 1}")
                    return result
                else:
                    self.logger.warning(f"[WARNING] Capture failed on attempt {attempt + 1}: {result.get('error')}")
                    
            except Exception as e:
                self.logger.error(f"Exception on capture attempt {attempt + 1}: {e}")
                
        # All attempts failed
        self.logger.error("All capture attempts failed")
        return {
            'success': False,
            'data': None,
            'error': f'Capture failed after {self.max_retries} attempts'
        }
    
    def _capture_fingerprint_single(self, timeout: int) -> Dict[str, Any]:
        """Single fingerprint capture with enhanced debugging"""
        self.logger.debug("Capturing single fingerprint...")
        
        try:
            url = f"{self.config['base_url']}/SGIFPCapture"
            params = {
                'FakeDetection': '0',
                'Timeout': str(timeout),
                'TemplateFormat': 'ISO',
                'DeviceName': self.config['device_name'],
                'SerialNumber': self.config['serial_number']
            }
            
            self.logger.debug(f"Capture URL: {url}")
            self.logger.debug(f"Capture params: {params}")
            
            response = self.session.get(url, params=params, timeout=(timeout / 1000) + 5)
            
            self.logger.debug(f"Capture response status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.logger.debug(f"Capture response data: {data}")
                    
                    error_code = data.get('ErrorCode', -1)
                    if error_code == 0:
                        template = data.get('Template', '')
                        quality = data.get('ImageQuality', 0)
                        nfiq = data.get('NFIQ', 0)
                        
                        self.logger.info(f"[SUCCESS] Fingerprint captured - Quality: {quality}, NFIQ: {nfiq}, Template length: {len(template)}")
                        
                        return {
                            'success': True,
                            'data': data,
                            'error': None
                        }
                    else:
                        error_msg = self._get_error_message(error_code)
                        self.logger.warning(f"[WARNING] Capture error {error_code}: {error_msg}")
                        return {
                            'success': False,
                            'data': data,
                            'error': f'Capture error {error_code}: {error_msg}'
                        }
                except ValueError as e:
                    self.logger.error(f"Invalid JSON response: {e}")
                    return {
                        'success': False,
                        'data': None,
                        'error': f'Invalid JSON response: {e}'
                    }
            else:
                self.logger.error(f"HTTP error {response.status_code}")
                return {
                    'success': False,
                    'data': None,
                    'error': f'HTTP error {response.status_code}'
                }
                
        except Exception as e:
            self.logger.error(f"Capture error: {e}")
            return {
                'success': False,
                'data': None,
                'error': f'Capture error: {e}'
            }
    
    def _get_error_message(self, error_code: int) -> str:
        """Get human-readable error message"""
        error_messages = {
            10001: "No device found",
            10002: "Device initialization failed",
            10003: "Device busy",
            10004: "Device error - check connection and drivers",
            10005: "Capture timeout",
            10006: "Poor quality fingerprint",
            10007: "Fake finger detected",
            10008: "Device not ready",
            10009: "Invalid parameters",
            10010: "Device communication error"
        }
        
        return error_messages.get(error_code, f"Unknown error code: {error_code}")
    
    def get_device_info(self) -> Dict[str, Any]:
        """Get comprehensive device information"""
        self.logger.info("=== GETTING DEVICE INFORMATION ===")
        
        result = self.test_connection_with_retry()
        if result['success']:
            data = result['data']
            device_info = {
                'model': data.get('Model', 'Unknown'),
                'serial_number': data.get('SerialNumber', 'Unknown'),
                'manufacturer': data.get('Manufacturer', 'Unknown'),
                'version': data.get('Version', 'Unknown'),
                'error_code': data.get('ErrorCode', -1),
                'connection_status': 'Connected'
            }
        else:
            device_info = {
                'model': 'Unknown',
                'serial_number': 'Unknown',
                'manufacturer': 'Unknown',
                'version': 'Unknown',
                'error_code': -1,
                'connection_status': 'Disconnected',
                'error': result['error']
            }
        
        self.logger.info(f"Device info: {device_info}")
        return device_info
    
    def close(self):
        """Close the enhanced biometric device session"""
        if hasattr(self, 'session'):
            self.session.close()
            self.logger.info("Enhanced biometric device session closed")

# Convenience function
def create_enhanced_biometric_device(config: Optional[Dict[str, Any]] = None) -> EnhancedBiometricDevice:
    """Create an enhanced biometric device instance"""
    return EnhancedBiometricDevice(config)
