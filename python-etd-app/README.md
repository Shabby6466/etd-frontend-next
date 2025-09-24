# ETD Python Desktop Application

Emergency Travel Document Desktop Application with Native Biometric Support

This Python-based desktop application replaces the Electron version with native biometric device integration, providing better performance and native system access.

## Features

- **Native Biometric Integration**: Direct Python HTTP client communication with SecuGen devices
- **Desktop GUI**: Modern tkinter-based interface matching the original Electron design
- **Form Validation**: Comprehensive citizen information form with validation
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Offline Capability**: Works without internet connection for data entry
- **Secure Authentication**: Built-in user authentication system
- **Logging**: Comprehensive logging for debugging and monitoring

## Technology Stack

- **Python 3.8+**: Core runtime
- **tkinter**: Native GUI framework (built-in with Python)
- **requests**: HTTP client for biometric device communication
- **PyInstaller**: Application packaging and distribution
- **Native SSL**: Built-in SSL/TLS support for secure communication

## Prerequisites

- Python 3.8 or higher
- SecuGen biometric device (HU20 or compatible)
- SecuGen WebAPI service running on localhost:8443

## Installation

### Development Setup

1. **Clone or download the application**:
   ```bash
   cd python-etd-app
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python main.py
   ```

### Production Build

1. **Build executable**:
   ```bash
   python build.py --build
   ```

2. **Run tests**:
   ```bash
   python build.py --test
   ```

3. **Complete build process**:
   ```bash
   python build.py --all
   ```

## Usage

### Starting the Application

```bash
# Development mode
python main.py

# Production executable (after building)
./dist/ETD_Desktop_App
```

### Default Login Credentials

- **Email**: admin@etd.com
- **Password**: admin123

### Biometric Device Setup

1. **Install SecuGen WebAPI**:
   - Download from: https://webapi.secugen.com/
   - Install with administrator privileges
   - Start the SgiBioSrv service

2. **Verify Device Connection**:
   - Connect SecuGen device via USB
   - Check Device Manager for proper driver installation
   - Test connection in the application

3. **Configure Device Settings**:
   - Device Name: HU20
   - Serial Number: H58220311290
   - Endpoint: https://localhost:8443/SGIFPCapture

## Configuration

### Application Settings

Edit `config.py` to modify application settings:

```python
# Biometric device settings
BIOMETRIC_BASE_URL = "https://localhost:8443"
BIOMETRIC_DEVICE_NAME = "HU20"
BIOMETRIC_SERIAL_NUMBER = "H58220311290"

# Window settings
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
```

### Environment Variables

Set environment variables for different configurations:

```bash
# Development mode
export ETD_ENV=development

# Production mode
export ETD_ENV=production
```

## Form Fields

### Required Fields
- Citizen ID (13 digits)
- First Name
- Last Name
- Father's Name
- Mother's Name
- Gender
- Date of Birth
- Birth Country
- Birth City
- City
- Profession
- Address
- Departure Date
- Requested By

### Optional Fields
- Height
- Eye Color
- Hair Color
- Transport Mode
- Investor
- Reason for Deport
- Amount
- Currency

### Biometric Data
- Fingerprint Template (ISO format)
- Image Quality Score
- NFIQ Score

## Biometric Integration

### Device Communication

The application uses native Python HTTP clients to communicate with SecuGen devices:

```python
from biometric_device import BiometricDevice

# Initialize device
device = BiometricDevice()

# Test connection
result = device.test_connection()

# Capture fingerprint
capture_result = device.capture_fingerprint()
```

### Error Handling

The application provides comprehensive error handling for biometric operations:

- **Connection Errors**: Network and device connectivity issues
- **Device Errors**: Hardware-specific error codes and messages
- **Timeout Handling**: Configurable timeout settings
- **Quality Validation**: Fingerprint quality assessment

### Security Features

- **SSL/TLS Support**: Secure communication with biometric devices
- **Local Communication**: All biometric operations use localhost
- **No External Dependencies**: No cloud or external service requirements
- **Data Encryption**: Fingerprint templates are handled securely

## Building and Distribution

### PyInstaller Build

```bash
# Create executable
python build.py --build

# Output location
./dist/ETD_Desktop_App.exe  # Windows
./dist/ETD_Desktop_App      # Linux/macOS
```

### Custom Build Options

```bash
# Clean build directories
python build.py --clean

# Run tests only
python build.py --test

# Complete build process
python build.py --all
```

### Distribution Packages

The build system creates distribution packages for different platforms:

- **Windows**: NSIS installer script
- **macOS**: DMG package (requires additional tools)
- **Linux**: AppImage or DEB package (requires additional tools)

## Troubleshooting

### Common Issues

1. **Biometric Device Not Found**:
   - Check USB connection
   - Verify device drivers
   - Ensure SgiBioSrv service is running

2. **Connection Timeout**:
   - Check firewall settings
   - Verify localhost:8443 is accessible
   - Test with browser: https://localhost:8443/SGIFPCapture

3. **SSL Certificate Errors**:
   - Application disables SSL verification for localhost
   - Check SecuGen WebAPI SSL configuration

4. **GUI Issues**:
   - Ensure tkinter is installed (usually built-in)
   - Check display settings and resolution

### Debug Mode

Enable debug logging:

```python
# In config.py
LOG_LEVEL = "DEBUG"
```

### Log Files

Application logs are saved to:
- `etd_app.log` - Application logs
- Console output - Real-time debugging

## Development

### Project Structure

```
python-etd-app/
├── main.py                 # Main application entry point
├── config.py               # Configuration settings
├── biometric_device.py     # Biometric device integration
├── build.py                # Build system
├── setup.py                # Package setup
├── requirements.txt        # Dependencies
├── README.md              # This file
└── dist/                  # Built executables
```

### Adding Features

1. **New Form Fields**: Modify `DataInputScreen.setup_form_fields()`
2. **Biometric Enhancements**: Extend `BiometricDevice` class
3. **GUI Improvements**: Update tkinter components
4. **Configuration**: Modify `config.py`

### Testing

```bash
# Run tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=. --cov-report=html
```

## Comparison with Electron Version

### Advantages of Python Version

- **Native Performance**: No JavaScript runtime overhead
- **Better Biometric Integration**: Direct Python HTTP clients
- **Smaller Footprint**: No Node.js dependencies
- **Easier Deployment**: Single executable file
- **Better System Integration**: Native OS integration
- **Simpler Debugging**: Python debugging tools

### Feature Parity

- ✅ Login screen with authentication
- ✅ Citizen data input form
- ✅ Biometric device integration
- ✅ Form validation
- ✅ Cross-platform support
- ✅ Offline capability
- ✅ Logging and error handling

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support and issues:

1. Check the troubleshooting section
2. Review application logs
3. Verify biometric device setup
4. Test with SecuGen WebAPI directly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### Version 1.0.0
- Initial release
- Native biometric device integration
- Desktop GUI with tkinter
- Form validation and data handling
- Cross-platform build system
- Comprehensive logging and error handling
