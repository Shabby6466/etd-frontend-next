# Directory Fix - "Unable to find Electron app at C:\Windows\System32"

## 🎯 **Problem Identified**

The error "Unable to find Electron app at C:\Windows\System32" occurs because:

1. **Wrong working directory**: Batch file runs from `System32` instead of `electron` folder
2. **Missing package.json**: Electron can't find the app configuration
3. **Path resolution issues**: `npx electron .` looks for `package.json` in current directory

## ✅ **SOLUTION IMPLEMENTED**

### **Fixed All Batch Files with Directory Management**

#### **Key Changes Made:**
1. **`cd /d "%~dp0"`** - Changes to script's directory
2. **Directory verification** - Checks for `package.json` existence
3. **Error handling** - Clear error messages if wrong directory
4. **Current directory display** - Shows where the script is running from

#### **What Each Fix Does:**

```batch
REM Change to the script's directory to ensure we're in the electron folder
cd /d "%~dp0"
echo Current directory: %CD%

REM Check if package.json exists (to verify we're in the right directory)
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the electron directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)
```

## 🚀 **How to Run Now**

### **Method 1: Right-click Batch File (Recommended)**
1. **Navigate to**: `electron` folder
2. **Right-click**: `run-with-secugen.bat`
3. **Select**: "Run as Administrator"
4. **Result**: Should work perfectly!

### **Method 2: Command Prompt**
```bash
# Open Command Prompt as Administrator
cd C:\Users\Office\Desktop\etd-prod\etd-frontend\electron
run-with-secugen.bat
```

### **Method 3: PowerShell**
```powershell
# Open PowerShell as Administrator
cd C:\Users\Office\Desktop\etd-prod\etd-frontend\electron
.\run-with-secugen.bat
```

## 📊 **Before vs After**

### **Before (Error)**
```
Error launching app
Unable to find Electron app at C:\Windows\System32
Cannot find module 'C:\Windows\System32'
```

### **After (Fixed)**
```
Starting ETD Electron App with SecuGen support...
Current directory: C:\Users\Office\Desktop\etd-prod\etd-frontend\electron
✅ Running with Administrator privileges
Starting Electron app...
[Electron app starts successfully]
```

## 🔧 **Technical Details**

### **What `cd /d "%~dp0"` Does:**
- **`%~dp0`**: Drive and path of the batch file
- **`cd /d`**: Changes directory and drive
- **Result**: Always runs from the `electron` folder

### **Why This Happens:**
- **Windows behavior**: Batch files can run from any directory
- **Working directory**: Defaults to `System32` when run as admin
- **Electron requirement**: Needs `package.json` in current directory
- **Path resolution**: `npx electron .` looks for `.` (current directory)

### **The Fix Explained:**
1. **`cd /d "%~dp0"`** - Forces script to run from its own directory
2. **Directory check** - Verifies `package.json` exists
3. **Error handling** - Clear message if wrong directory
4. **Success path** - Only runs if everything is correct

## 🎯 **All Working Methods**

### **Method 1: Batch Files (Easiest)**
```bash
# Navigate to electron folder first
cd C:\Users\Office\Desktop\etd-prod\etd-frontend\electron

# Then run the batch file
run-with-secugen.bat
```

### **Method 2: npm Scripts**
```bash
# Right-click Command Prompt → "Run as Administrator"
cd electron
npm run start:secugen
```

### **Method 3: Direct npx**
```bash
# Right-click Command Prompt → "Run as Administrator"
cd electron
npx electron . --no-sandbox --disable-web-security
```

## 🆘 **Troubleshooting**

### **If you still get directory errors:**
1. **Check location**: Make sure you're in the `electron` folder
2. **Verify files**: Ensure `package.json` exists
3. **Run from correct location**: Always run from `electron` directory

### **If you get "package.json not found":**
1. **Navigate to electron folder**: `cd electron`
2. **Check files**: `dir package.json`
3. **Reinstall if needed**: `npm install`

### **If you get permission errors:**
1. **Run as Administrator**: Right-click Command Prompt → "Run as Administrator"
2. **Check antivirus**: Some antivirus software blocks electron
3. **Try different flags**: Use `--no-sandbox` flag

## 🎉 **Success Indicators**

When working correctly, you should see:
- ✅ **Current directory shows**: `C:\Users\Office\Desktop\etd-prod\etd-frontend\electron`
- ✅ **No "package.json not found" error**
- ✅ **Electron app starts** without errors
- ✅ **SecuGen connection test** works

## 📝 **Quick Reference**

### **Run SecuGen App:**
```bash
# Navigate to electron folder
cd C:\Users\Office\Desktop\etd-prod\etd-frontend\electron

# Run the batch file
run-with-secugen.bat
```

### **Development Mode:**
```bash
cd electron
npm run dev
```

### **Production Build:**
```bash
cd electron
npm run build
```

---

**The fix**: Batch files now automatically change to the correct directory and verify `package.json` exists! 🚀
