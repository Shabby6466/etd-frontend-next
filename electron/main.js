const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  // Create the browser window
  // Check for command line arguments
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  const noSandbox = process.argv.includes('--no-sandbox');
  const disableWebSecurity = process.argv.includes('--disable-web-security');
  const enableDevTools = process.argv.includes('--devtools');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Completely disable for desktop SecuGen access
      allowRunningInsecureContent: true, // Allow HTTPS localhost
      sandbox: false, // Disable sandbox for desktop device access
      experimentalFeatures: true, // Enable experimental features for SecuGen
      enableRemoteModule: true, // Enable remote module for desktop features
      additionalArguments: [
        '--disable-features=VizDisplayCompositor',
        '--enable-experimental-web-platform-features',
        '--disable-gpu', // Fix GPU process crashes
        '--disable-gpu-sandbox', // Disable GPU sandbox
        '--disable-software-rasterizer', // Disable software rasterizer
        '--disable-background-timer-throttling', // Disable background throttling
        '--disable-backgrounding-occluded-windows', // Disable backgrounding
        '--disable-renderer-backgrounding', // Disable renderer backgrounding
        '--disable-field-trial-config', // Disable field trials
        '--disable-ipc-flooding-protection', // Disable IPC flooding protection
        '--ignore-certificate-errors', // Ignore SSL certificate errors
        '--ignore-ssl-errors', // Ignore SSL errors
        '--ignore-certificate-errors-spki-list', // Ignore certificate errors
        '--allow-running-insecure-content', // Allow insecure content
        '--disable-web-security', // Disable web security
        '--disable-features=TranslateUI', // Disable translate UI
        '--disable-extensions', // Disable extensions
        '--no-sandbox', // Disable sandbox
        '--disable-background-networking', // Disable background networking
        '--disable-default-apps', // Disable default apps
        '--disable-sync', // Disable sync
        '--disable-translate', // Disable translate
        '--disable-component-extensions-with-background-pages', // Disable component extensions
        '--disable-background-downloads', // Disable background downloads
        '--disable-client-side-phishing-detection', // Disable phishing detection
        '--disable-hang-monitor', // Disable hang monitor
        '--disable-prompt-on-repost', // Disable prompt on repost
        '--disable-domain-reliability', // Disable domain reliability
        '--disable-features=VizDisplayCompositor,TranslateUI', // Disable additional features
        '--disable-ipc-flooding-protection' // Disable IPC flooding protection
      ]
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Load the app
  if (isDev) {
    try {
      mainWindow.loadURL('http://localhost:3002');
      // Only open developer tools if explicitly requested with --devtools flag
      if (enableDevTools) {
        mainWindow.webContents.openDevTools();
      }
    } catch (error) {
      console.log('Dev server not available, loading from build files');
      mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
    }
  } else {
    // In production, always load from build files
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  }

  // Set Content Security Policy to fix security warnings
  // But don't apply it to SecuGen API requests to avoid interfering with the service
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // Don't modify SecuGen API responses
    if (details.url.includes('localhost:8443') || details.url.includes('127.0.0.1:8443')) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http: localhost:* 127.0.0.1:* ws: wss:; " +
          "connect-src 'self' https: http: localhost:* 127.0.0.1:* ws: wss:; " +
          "img-src 'self' data: blob: https: http: localhost:* 127.0.0.1:*; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; " +
          "style-src 'self' 'unsafe-inline' https: http:; " +
          "font-src 'self' data: https: http:; " +
          "object-src 'none'; " +
          "base-uri 'self'"
        ]
      }
    });
  });

  // Intercept requests to SecuGen service to fix Origin/Referer headers
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('localhost:8443') || details.url.includes('127.0.0.1:8443')) {
      // Modify headers to use localhost origin for SecuGen requests
      const modifiedHeaders = {
        ...details.requestHeaders,
        'Origin': 'http://localhost:3002',
        'Referer': 'http://localhost:3002/'
      };
      callback({ requestHeaders: modifiedHeaders });
      return;
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Add error handling for failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorDescription, 'URL:', validatedURL);
    if (isDev && validatedURL.includes('localhost:3002')) {
      console.log('Dev server failed, trying to load from build files...');
      mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
    }
  });

  // Add console logging for debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[${level}] ${message} (${sourceId}:${line})`);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// SecuGen device integration for desktop apps
ipcMain.handle('secugen-test-connection', async (event, endpoint) => {
  try {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    const url = new URL(endpoint + '?Timeout=3000');
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.request(url, { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ success: true, data: result });
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });
      
      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });
      
      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('secugen-capture', async (event, endpoint, params) => {
  try {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    const url = new URL(endpoint);
    Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));
    
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.request(url, { method: 'GET' }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ success: true, data: result });
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });
      
      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        resolve({ success: false, error: 'Capture timeout' });
      });
      
      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// XML file validation functionality
ipcMain.handle('validate-login-xml', async (event, credentials) => {
  try {
    const { email, password } = credentials;
    
    // Try to read from C:\Users\Default\AppData first
    let xmlPath;
    let xmlContent;
    
    try {
      const defaultUserPath = path.join(os.homedir(), '..', 'Default', 'AppData');
      xmlPath = path.join(defaultUserPath, 'etLog.xml');
      xmlContent = fs.readFileSync(xmlPath, 'utf8');
    } catch (defaultError) {
      console.warn('Failed to read from Default user directory:', defaultError.message);
      
      // Fallback to current user's AppData
      try {
        const userAppData = path.join(os.homedir(), 'AppData', 'Local', 'ETD');
        xmlPath = path.join(userAppData, 'etLog.xml');
        xmlContent = fs.readFileSync(xmlPath, 'utf8');
      } catch (fallbackError) {
        console.error('Failed to read from fallback location:', fallbackError.message);
        return { isValid: false, error: 'XML file not found' };
      }
    }
    
    // Parse XML content
    try {
      // Simple XML parsing for email and password
      const emailMatch = xmlContent.match(/<email>(.*?)<\/email>/);
      const passwordMatch = xmlContent.match(/<password>(.*?)<\/password>/);
      
      if (!emailMatch || !passwordMatch) {
        return { isValid: false, error: 'Invalid XML format' };
      }
      
      const storedEmail = emailMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      const storedPassword = passwordMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      
      // Validate credentials
      if (storedEmail === email && storedPassword === password) {
        console.log('XML validation successful');
        return { isValid: true, credentials: { email: storedEmail, password: storedPassword } };
      } else {
        console.log('XML validation failed - credentials do not match');
        return { isValid: false, error: 'Invalid credentials' };
      }
    } catch (parseError) {
      console.error('XML parsing error:', parseError);
      return { isValid: false, error: 'XML parsing failed' };
    }
  } catch (error) {
    console.error('XML validation error:', error);
    return { isValid: false, error: error.message };
  }
});

ipcMain.handle('check-xml-file-exists', async () => {
  try {
    // Check C:\Users\Default\AppData first
    try {
      const defaultUserPath = path.join(os.homedir(), '..', 'Default', 'AppData');
      const xmlPath = path.join(defaultUserPath, 'etLog.xml');
      if (fs.existsSync(xmlPath)) {
        return { exists: true, path: xmlPath };
      }
    } catch (defaultError) {
      console.warn('Failed to check Default user directory:', defaultError.message);
    }
    
    // Fallback to current user's AppData
    try {
      const userAppData = path.join(os.homedir(), 'AppData', 'Local', 'ETD');
      const xmlPath = path.join(userAppData, 'etLog.xml');
      if (fs.existsSync(xmlPath)) {
        return { exists: true, path: xmlPath };
      }
    } catch (fallbackError) {
      console.warn('Failed to check fallback location:', fallbackError.message);
    }
    
    return { exists: false };
  } catch (error) {
    console.error('XML file check error:', error);
    return { exists: false, error: error.message };
  }
});

ipcMain.handle('xml-storage-save-application', async (event, applicationData) => {
  try {
    const storageDir = path.join(os.homedir(), 'AppData', 'Local', 'xml_draft');
    
    // Ensure directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    // Get next sequence number
    const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.xml'));
    const sequenceNumbers = files
      .map(file => {
        const match = file.match(/^(\d+)_/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    const nextSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;
    
    // Create filename
    const filename = `${nextSequence}_${applicationData.citizen_id}_${Date.now()}.xml`;
    const filepath = path.join(storageDir, filename);
    
    // Generate XML content
    const xmlContent = generateXMLContent(applicationData);
    
    // Write file
    fs.writeFileSync(filepath, xmlContent, 'utf8');
    
    return { success: true, filepath, filename };
  } catch (error) {
    console.error('Error saving application:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('xml-storage-get-applications', async () => {
  try {
    const storageDir = path.join(os.homedir(), 'AppData', 'Local', 'xml_draft');
    
    if (!fs.existsSync(storageDir)) {
      return { success: true, applications: [] };
    }
    
    const files = fs.readdirSync(storageDir).filter(file => file.endsWith('.xml'));
    return { success: true, applications: files };
  } catch (error) {
    console.error('Error getting applications:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('xml-storage-read-application', async (event, filename) => {
  try {
    const storageDir = path.join(os.homedir(), 'AppData', 'Local', 'xml_draft');
    const filepath = path.join(storageDir, filename);
    
    const content = fs.readFileSync(filepath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error('Error reading application:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to generate XML content
function generateXMLContent(data) {
  const timestamp = new Date().toISOString();
  
  const escapeXML = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<application>
  <metadata>
    <timestamp>${timestamp}</timestamp>
    <sequence_number>${data.citizen_id}</sequence_number>
    <created_by>ETD_Application</created_by>
  </metadata>
  
  <personal_information>
    <citizen_id>${escapeXML(data.citizen_id)}</citizen_id>
    <first_name>${escapeXML(data.first_name)}</first_name>
    <last_name>${escapeXML(data.last_name)}</last_name>
    <father_name>${escapeXML(data.father_name)}</father_name>
    <mother_name>${escapeXML(data.mother_name)}</mother_name>
    <gender>${escapeXML(data.gender)}</gender>
    <date_of_birth>${escapeXML(data.date_of_birth)}</date_of_birth>
    <profession>${escapeXML(data.profession)}</profession>
  </personal_information>
  
  <address_information>
    <pakistan_city>${escapeXML(data.pakistan_city)}</pakistan_city>
    <pakistan_address>${escapeXML(data.pakistan_address)}</pakistan_address>
    <birth_country>${escapeXML(data.birth_country)}</birth_country>
    <birth_city>${escapeXML(data.birth_city)}</birth_city>
  </address_information>
  
  <physical_characteristics>
    <height>${escapeXML(data.height || '')}</height>
    <color_of_eyes>${escapeXML(data.color_of_eyes || '')}</color_of_eyes>
    <color_of_hair>${escapeXML(data.color_of_hair || '')}</color_of_hair>
  </physical_characteristics>
  
  <travel_information>
    <requested_by>${escapeXML(data.requested_by)}</requested_by>
    <transport_mode>${escapeXML(data.transport_mode || '')}</transport_mode>
    <investor>${escapeXML(data.investor || '')}</investor>
    <reason_for_deport>${escapeXML(data.reason_for_deport || '')}</reason_for_deport>
    <amount>${data.amount || 0}</amount>
    <currency>${escapeXML(data.currency || '')}</currency>
  </travel_information>
  
  <biometric_data>
    <image_base64>${data.image}</image_base64>
    <fingerprint_base64>${data.fingerprint || ''}</fingerprint_base64>
    <fingerprint_template>${data.fingerprintTemplate || ''}</fingerprint_template>
    <fingerprint_device>${escapeXML(data.fingerprintDevice || '')}</fingerprint_device>
    <wsq_fingerprint>${data.wsqFingerprint || ''}</wsq_fingerprint>
    <fingerprint_device_serial>${escapeXML(data.fingerprintDeviceSerial || '')}</fingerprint_device_serial>
    <fingerprint_dpi>${data.fingerprintDpi || 0}</fingerprint_dpi>
    <fingerprint_quality>${data.fingerprintQuality || 0}</fingerprint_quality>
  </biometric_data>
  
  ${data.biometricData ? `
  <enhanced_biometric_data>
    <wsq_fingerprint>${data.biometricData.wsqFingerprint}</wsq_fingerprint>
    <fingerprint_template_base64>${data.biometricData.fingerprintTemplateBase64}</fingerprint_template_base64>
    <fingerprint_device_model>${escapeXML(data.biometricData.fingerprintDeviceModel || '')}</fingerprint_device_model>
    <fingerprint_device_serial>${escapeXML(data.biometricData.fingerprintDeviceSerial || '')}</fingerprint_device_serial>
    <image_dpi>${data.biometricData.imageDpi || 0}</image_dpi>
    <image_quality>${data.biometricData.imageQuality || 0}</image_quality>
  </enhanced_biometric_data>
  ` : ''}
</application>`;
}
