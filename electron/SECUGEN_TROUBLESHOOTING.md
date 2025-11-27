# SecuGen Fingerprint Device Troubleshooting Guide

## Error Code 10004: Device Error

This error indicates that the SecuGen fingerprint device is not properly connected or recognized by the system.

### Quick Fixes (Try these first)

1. **Check Physical Connection**
   - Ensure the SecuGen device is properly connected via USB
   - Try a different USB port
   - Check if the USB cable is working (try with another device)

2. **Restart Services**
   - Close the application
   - Restart the SgiBioSrv service (if running as a service)
   - Reopen the application

3. **Driver Issues**
   - Check Windows Device Manager for any device conflicts
   - Look for yellow warning triangles next to the SecuGen device
   - Reinstall SecuGen drivers if necessary

### Detailed Troubleshooting Steps

#### Step 1: Verify SgiBioSrv Service
```bash
# Check if the service is running
netstat -an | findstr :8443
```

If the service is not running:
1. Download and install SecuGen WebAPI from: https://webapi.secugen.com/
2. Start the SgiBioSrv service
3. Verify it's accessible at: https://localhost:8443/SGIFPCapture

#### Step 2: Test Device Connection
1. Open Device Manager (devmgmt.msc)
2. Look for "SecuGen" or "Fingerprint" devices
3. If you see a device with a warning icon:
   - Right-click → Update driver
   - Or uninstall and reconnect the device

#### Step 3: Check Windows Services
1. Open Services (services.msc)
2. Look for "SgiBioSrv" or similar SecuGen services
3. If found, ensure it's running and set to "Automatic" startup

#### Step 4: Browser/Electron Permissions
1. Ensure the application has permission to access localhost
2. Check Windows Firewall settings
3. Try running the application as Administrator

### Common Solutions

#### Solution 1: Reinstall SecuGen Software
1. Uninstall existing SecuGen software
2. Download latest version from SecuGen website
3. Install with Administrator privileges
4. Restart computer
5. Test connection

#### Solution 2: USB Power Management
1. Open Device Manager
2. Find the SecuGen device
3. Right-click → Properties → Power Management
4. Uncheck "Allow the computer to turn off this device to save power"

#### Solution 3: Windows Compatibility
1. Right-click the SecuGen installer
2. Select "Properties" → "Compatibility"
3. Check "Run this program in compatibility mode for: Windows 10"
4. Check "Run this program as an administrator"

### Alternative Endpoints

If the default endpoint doesn't work, try these alternatives:
- `https://localhost:8000/SGIFPCapture`
- `https://127.0.0.1:8443/SGIFPCapture`
- `http://localhost:8443/SGIFPCapture` (without SSL)

### Testing the Connection

You can test the SecuGen service manually by opening this URL in your browser:
```
https://localhost:8443/SGIFPCapture?Timeout=3000
```

Expected response:
```json
{
  "ErrorCode": 0,
  "Manufacturer": "SecuGen",
  "Model": "Your Device Model"
}
```

### Error Codes Reference

- **10001**: No device found
- **10002**: Device initialization failed
- **10003**: Device busy
- **10004**: Device error (connection issue)
- **10005**: Capture timeout
- **10006**: Poor quality fingerprint

### Still Having Issues?

1. **Check SecuGen Documentation**: https://webapi.secugen.com/
2. **Contact SecuGen Support**: For hardware-specific issues
3. **Try Different Device**: Test with another SecuGen device if available
4. **System Requirements**: Ensure your system meets SecuGen requirements

### Prevention Tips

1. Always properly eject the device before disconnecting
2. Keep SecuGen drivers updated
3. Use a dedicated USB port for the fingerprint device
4. Avoid using USB hubs with the fingerprint device
5. Keep the device clean and free from debris

---

**Note**: This troubleshooting guide is specific to SecuGen devices. For other fingerprint device brands, refer to their respective documentation.

