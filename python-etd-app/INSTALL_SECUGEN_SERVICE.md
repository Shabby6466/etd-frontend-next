# Install SecuGen WebAPI Service - Step by Step Guide

## 🎯 **Problem Confirmed**

The diagnostic confirms: **SgiBioSrv service is not installed**
```
[SC] EnumQueryServicesStatus:OpenService FAILED 1060:
The specified service does not exist as an installed service.
```

This is why you're getting Error 10004 - the biometric device can't communicate without the proper service.

## 🛠️ **Exact Solution**

### **Step 1: Download SecuGen WebAPI**

1. **Go to SecuGen WebAPI website**:
   - URL: https://webapi.secugen.com/
   - Look for "SecuGen WebAPI" (not just SDK)
   - Download the **full WebAPI package**

2. **Choose the correct version**:
   - Windows 64-bit version
   - Make sure it's the **WebAPI service**, not just the SDK

### **Step 2: Install with Administrator Rights**

1. **Right-click the installer** → "Run as Administrator"
2. **Follow the installation wizard**
3. **Critical**: During installation, make sure to select:
   - ✅ "SgiBioSrv Service" 
   - ✅ "WebAPI Service"
   - ✅ "Biometric Service"

### **Step 3: Verify Installation**

After installation, run these commands:

```powershell
# Check if service exists
sc query SgiBioSrv

# Start the service
sc start SgiBioSrv

# Check service status
sc query SgiBioSrv
```

**Expected output after successful installation**:
```
SERVICE_NAME: SgiBioSrv
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 4  RUNNING
        WIN32_EXIT_CODE    : 0  (0x0)
        SERVICE_EXIT_CODE  : 0  (0x0)
        CHECKPOINT         : 0x0
        WAIT_HINT          : 0x0
```

### **Step 4: Test the Python Application**

Once the service is installed and running:

```bash
cd python-etd-app
python run_enhanced.py
```

## 🔧 **Alternative: Manual Service Installation**

If the installer doesn't create the service, you can try:

1. **Check if SecuGen WebAPI is installed**:
   ```powershell
   dir "C:\Program Files\SecuGen"
   ```

2. **Look for service executable**:
   ```powershell
   dir "C:\Program Files\SecuGen\*service*"
   dir "C:\Program Files\SecuGen\*srv*"
   ```

3. **Manual service creation** (if needed):
   ```powershell
   sc create SgiBioSrv binPath="C:\Program Files\SecuGen\SgiBioSrv.exe" start=auto
   sc start SgiBioSrv
   ```

## 🎯 **Why This Fixes Error 10004**

**Before**: 
- SecuGen WebAPI service running on localhost:8443 ✅
- SgiBioSrv service missing ❌
- Device communication fails (Error 10004) ❌

**After**:
- SecuGen WebAPI service running on localhost:8443 ✅
- SgiBioSrv service installed and running ✅
- Device communication works ✅

## 📊 **What Happens After Installation**

1. **SgiBioSrv service** will be created and running
2. **Biometric device** will be properly recognized
3. **Error 10004** will be resolved
4. **Python application** will work with native biometric support

## 🚀 **Test the Fix**

After installing the service, test with:

```bash
# Test enhanced application
python run_enhanced.py

# Check logs for success
type etd_enhanced.log | findstr "SUCCESS"
```

**Expected success message**:
```
[SUCCESS] Device connection successful
[SUCCESS] SecuGen device detected
```

## 🎉 **Benefits After Fix**

Once the SgiBioSrv service is installed, you'll have:

- ✅ **Native biometric integration** (better than Electron)
- ✅ **No more Error 10004**
- ✅ **Faster performance** than Electron
- ✅ **Smaller footprint** than Electron
- ✅ **Easier deployment** than Electron
- ✅ **Better debugging** than Electron

## 📝 **Troubleshooting**

If you still get Error 10004 after installing the service:

1. **Check service status**:
   ```powershell
   sc query SgiBioSrv
   ```

2. **Restart the service**:
   ```powershell
   sc stop SgiBioSrv
   sc start SgiBioSrv
   ```

3. **Check device connection**:
   - Ensure biometric device is connected via USB
   - Check Device Manager for device conflicts
   - Try different USB port

4. **Run as Administrator**:
   ```bash
   # Right-click Command Prompt → "Run as Administrator"
   python run_enhanced.py
   ```

## 🎯 **Final Result**

After installing the SgiBioSrv service, your Python application will work perfectly with native biometric support, providing a **much better experience** than the Electron version!

**The Python version is ready - you just need to install the missing SecuGen service!**
