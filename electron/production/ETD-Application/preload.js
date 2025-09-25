const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // SecuGen device integration for desktop apps
  secugenTestConnection: (endpoint) => ipcRenderer.invoke('secugen-test-connection', endpoint),
  secugenCapture: (endpoint, params) => ipcRenderer.invoke('secugen-capture', endpoint, params),
  
  // XML file validation functionality
  validateLoginXML: (credentials) => ipcRenderer.invoke('validate-login-xml', credentials),
  checkXMLFileExists: () => ipcRenderer.invoke('check-xml-file-exists'),
  
  // XML Storage functionality
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // Add any other APIs you need for your app
  onApplicationData: (callback) => {
    ipcRenderer.on('application-data', callback);
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
