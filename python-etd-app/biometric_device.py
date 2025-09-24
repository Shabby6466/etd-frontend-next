"""
Biometric Device Integration for ETD Python Desktop Application

This module provides native biometric device communication using Python HTTP clients,
replacing the Electron-based approach with direct Python integration.
"""

import requests
import urllib3
import logging
import ssl
from typing import Dict, Any, Optional
from config import get_config

logger = logging.getLogger(__name__)

class BiometricDeviceError(Exception):
    """Custom exception for biometric device errors"""
    pass

class BiometricDevice:
    """
    Handles biometric device communication using native Python HTTP clients.
    
    This replaces the Electron main process approach with direct Python integration,
    providing better native support for biometric devices.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize biometric device handler
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = get_config()
        self.biometric_config = self.config.get_biometric_config()
        self.ssl_config = self.config.get_ssl_config()
        
        # Override with provided config if available
        if config:
            self.biometric_config.update(config)
        
        # Setup HTTP session
        self.session = requests.Session()
        
        # Configure SSL
        if not self.ssl_config['verify']:
            self.session.verify = False
            if not self.ssl_config['warnings']:
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Set default headers
        self.session.headers.update({
            'User-Agent': f'{self.config.APP_NAME}/{self.config.APP_VERSION}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        logger.info(f"Initialized biometric device: {self.biometric_config['device_name']} "
                   f"(Serial: {self.biometric_config['serial_number']})")
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to biometric device
        
        Returns:
            Dictionary with success status, data, and error information
        """
        try:
            url = f"{self.biometric_config['base_url']}/SGIFPCapture"
            params = {
                'Timeout': str(self.biometric_config['test_timeout']),
                'DeviceName': self.biometric_config['device_name'],
                'SerialNumber': self.biometric_config['serial_number']
            }
            
            logger.info(f"Testing biometric device connection: {url}")
            logger.debug(f"Connection parameters: {params}")
            
            response = self.session.get(
                url, 
                params=params, 
                timeout=self.biometric_config['test_timeout'] / 1000
            )
            
            # Check HTTP status
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            
            logger.info(f"Biometric device test response: {data}")
            
            # Check for device errors
            error_code = data.get('ErrorCode', -1)
            if error_code != 0:
                error_msg = self._get_error_message(error_code)
                logger.warning(f"Biometric device error: {error_code} - {error_msg}")
                return {
                    'success': False,
                    'data': data,
                    'error': f"Device error {error_code}: {error_msg}"
                }
            
            return {
                'success': True,
                'data': data,
                'error': None
            }
            
        except requests.exceptions.Timeout:
            error_msg = "Connection timeout - device may not be responding"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error - device not accessible: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except ValueError as e:
            error_msg = f"Invalid JSON response: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
    
    def capture_fingerprint(self, timeout: Optional[int] = None) -> Dict[str, Any]:
        """
        Capture fingerprint from biometric device
        
        Args:
            timeout: Optional timeout in milliseconds (uses default if not provided)
            
        Returns:
            Dictionary with success status, data, and error information
        """
        try:
            if timeout is None:
                timeout = self.biometric_config['timeout']
            
            url = f"{self.biometric_config['base_url']}/SGIFPCapture"
            params = {
                'FakeDetection': '0',
                'Timeout': str(timeout),
                'TemplateFormat': 'ISO',
                'DeviceName': self.biometric_config['device_name'],
                'SerialNumber': self.biometric_config['serial_number']
            }
            
            logger.info(f"Capturing fingerprint: {url}")
            logger.debug(f"Capture parameters: {params}")
            
            response = self.session.get(
                url, 
                params=params, 
                timeout=(timeout / 1000) + 5  # Add 5 seconds buffer
            )
            
            # Check HTTP status
            response.raise_for_status()
            
            # Parse JSON response
            data = response.json()
            
            logger.info(f"Fingerprint capture response: {data}")
            
            # Check for device errors
            error_code = data.get('ErrorCode', -1)
            if error_code != 0:
                error_msg = self._get_error_message(error_code)
                logger.warning(f"Fingerprint capture error: {error_code} - {error_msg}")
                return {
                    'success': False,
                    'data': data,
                    'error': f"Capture error {error_code}: {error_msg}"
                }
            
            # Validate capture data
            template = data.get('Template', '')
            if not template:
                logger.warning("No fingerprint template received")
                return {
                    'success': False,
                    'data': data,
                    'error': "No fingerprint template received"
                }
            
            logger.info(f"Fingerprint captured successfully - Template length: {len(template)}")
            
            return {
                'success': True,
                'data': data,
                'error': None
            }
            
        except requests.exceptions.Timeout:
            error_msg = "Capture timeout - please try again"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error during capture: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error during capture: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except ValueError as e:
            error_msg = f"Invalid JSON response: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error during capture: {e}"
            logger.error(error_msg)
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
    
    def get_device_info(self) -> Dict[str, Any]:
        """
        Get device information from the biometric device
        
        Returns:
            Dictionary with device information
        """
        result = self.test_connection()
        if result['success']:
            data = result['data']
            return {
                'model': data.get('Model', 'Unknown'),
                'serial_number': data.get('SerialNumber', 'Unknown'),
                'manufacturer': data.get('Manufacturer', 'Unknown'),
                'version': data.get('Version', 'Unknown'),
                'error_code': data.get('ErrorCode', -1)
            }
        else:
            return {
                'model': 'Unknown',
                'serial_number': 'Unknown',
                'manufacturer': 'Unknown',
                'version': 'Unknown',
                'error_code': -1,
                'error': result['error']
            }
    
    def _get_error_message(self, error_code: int) -> str:
        """
        Get human-readable error message for error code
        
        Args:
            error_code: Device error code
            
        Returns:
            Human-readable error message
        """
        error_messages = {
            10001: "No device found",
            10002: "Device initialization failed",
            10003: "Device busy",
            10004: "Device error - check connection",
            10005: "Capture timeout",
            10006: "Poor quality fingerprint",
            10007: "Fake finger detected",
            10008: "Device not ready",
            10009: "Invalid parameters",
            10010: "Device communication error"
        }
        
        return error_messages.get(error_code, f"Unknown error code: {error_code}")
    
    def is_device_available(self) -> bool:
        """
        Check if biometric device is available
        
        Returns:
            True if device is available, False otherwise
        """
        result = self.test_connection()
        return result['success'] and result['data'].get('ErrorCode') == 0
    
    def get_capture_quality(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract quality information from capture data
        
        Args:
            data: Capture response data
            
        Returns:
            Dictionary with quality metrics
        """
        return {
            'image_quality': data.get('ImageQuality', 0),
            'nfiq': data.get('NFIQ', 0),
            'template_length': len(data.get('Template', '')),
            'error_code': data.get('ErrorCode', -1)
        }
    
    def close(self):
        """Close the biometric device session"""
        if hasattr(self, 'session'):
            self.session.close()
            logger.info("Biometric device session closed")

# Convenience function for easy import
def create_biometric_device(config: Optional[Dict[str, Any]] = None) -> BiometricDevice:
    """
    Create a biometric device instance
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        BiometricDevice instance
    """
    return BiometricDevice(config)
