"""
Configuration settings for ETD Python Desktop Application
"""

import os
from typing import Dict, Any

class Config:
    """Application configuration"""
    
    # Application settings
    APP_NAME = "ETD Desktop Application"
    APP_VERSION = "1.0.0"
    APP_AUTHOR = "TERARARE Team"
    
    # Window settings
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    MIN_WIDTH = 600
    MIN_HEIGHT = 400
    
    # Biometric device settings
    BIOMETRIC_BASE_URL = "https://localhost:8443"
    BIOMETRIC_DEVICE_NAME = "HU20"
    BIOMETRIC_SERIAL_NUMBER = "H58220311290"
    BIOMETRIC_TIMEOUT = 25000  # milliseconds
    BIOMETRIC_TEST_TIMEOUT = 5000  # milliseconds
    
    # SSL settings
    SSL_VERIFY = False  # Disable SSL verification for localhost
    SSL_WARNINGS = False  # Disable SSL warnings
    
    # Logging settings
    LOG_LEVEL = "INFO"
    LOG_FILE = "etd_app.log"
    LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
    
    # Form validation settings
    REQUIRED_FIELDS = [
        'citizen_id', 'first_name', 'last_name', 'father_name', 'mother_name',
        'gender', 'date_of_birth', 'birth_country', 'birth_city', 'city',
        'profession', 'address', 'departure_date', 'requested_by'
    ]
    
    OPTIONAL_FIELDS = [
        'height', 'eye_color', 'hair_color', 'transport_mode', 'investor',
        'reason_for_deport', 'amount', 'currency'
    ]
    
    # Gender options
    GENDER_OPTIONS = ['Male', 'Female', 'Other']
    
    # Date format
    DATE_FORMAT = "%Y-%m-%d"
    
    # Default authentication (replace with real authentication)
    DEFAULT_CREDENTIALS = {
        'admin@etd.com': 'admin123'
    }
    
    @classmethod
    def get_biometric_config(cls) -> Dict[str, Any]:
        """Get biometric device configuration"""
        return {
            'base_url': cls.BIOMETRIC_BASE_URL,
            'device_name': cls.BIOMETRIC_DEVICE_NAME,
            'serial_number': cls.BIOMETRIC_SERIAL_NUMBER,
            'timeout': cls.BIOMETRIC_TIMEOUT,
            'test_timeout': cls.BIOMETRIC_TEST_TIMEOUT
        }
    
    @classmethod
    def get_ssl_config(cls) -> Dict[str, Any]:
        """Get SSL configuration"""
        return {
            'verify': cls.SSL_VERIFY,
            'warnings': cls.SSL_WARNINGS
        }
    
    @classmethod
    def get_logging_config(cls) -> Dict[str, Any]:
        """Get logging configuration"""
        return {
            'level': cls.LOG_LEVEL,
            'file': cls.LOG_FILE,
            'format': cls.LOG_FORMAT
        }

class DevelopmentConfig(Config):
    """Development configuration"""
    LOG_LEVEL = "DEBUG"
    SSL_WARNINGS = True

class ProductionConfig(Config):
    """Production configuration"""
    LOG_LEVEL = "WARNING"
    SSL_VERIFY = True  # Enable SSL verification in production

def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.getenv('ETD_ENV', 'development').lower()
    
    if env == 'production':
        return ProductionConfig()
    else:
        return DevelopmentConfig()
