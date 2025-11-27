/**
 * Utility functions for creating and saving XML log files
 */

export interface LoginCredentials {
  email: string;
  password: string;
}
/**
 * Creates XML content with login credentials
 */
export function createLoginXML(credentials: LoginCredentials): string {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<etLog>
  <email>${escapeXml(credentials.email)}</email>
  <password>${escapeXml(credentials.password)}</password>
  <timestamp>${new Date().toISOString()}</timestamp>
</etLog>`;
  
  return xmlContent;
}

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Saves XML content to a secure location
 * For web applications, this will attempt to save to a more secure location
 * and provide fallback options
 */
export async function saveLoginXML(credentials: LoginCredentials): Promise<void> {
  try {
    const xmlContent = createLoginXML(credentials);
    
    // Check if we're in an Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const result = await (window as any).electronAPI.saveLoginXML(credentials);
        if (result.success) {
          console.log('XML file saved to secure location:', result.path);
          return;
        } else {
          console.warn('Electron save failed, falling back to server API:', result.error);
        }
      } catch (electronError) {
        console.warn('Electron API not available, falling back to server API:', electronError);
      }
    }
    
    // Try server-side API to save to secure location
    try {
      const response = await fetch('/api/save-login-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('XML file saved to secure location via server:', result.path);
        return;
      } else {
        console.warn('Server save failed, falling back to File System Access API:', result.error);
      }
    } catch (serverError) {
      console.warn('Server API not available, falling back to File System Access API:', serverError);
    }
    
    // Fallback: Try to save to a more secure location using File System Access API
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'etLog.xml',
          types: [{
            description: 'XML files',
            accept: { 'application/xml': ['.xml'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(xmlContent);
        await writable.close();
        
        console.log('XML file saved to secure location via File System Access API');
        return;
      } catch (fsError) {
        console.warn('File System Access API failed, falling back to download:', fsError);
      }
    }
    
    // Final fallback: Download to user's chosen location
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'etLog.xml';
    link.style.display = 'none';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    console.log('XML file downloaded successfully');
  } catch (error) {
    console.error('Error saving XML file:', error);
    throw new Error('Failed to save login XML file');
  }
}

/**
 * Alternative method for Electron/desktop applications
 * This would be used in the Electron main process
 */
export function createElectronXMLSaveFunction() {
  return `
const fs = require('fs');
const path = require('path');
const os = require('os');

function saveLoginXML(credentials) {
  try {
    const xmlContent = \`<?xml version="1.0" encoding="UTF-8"?>
<etLog>
  <email>\${credentials.email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</email>
  <password>\${credentials.password.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</password>
  <timestamp>\${new Date().toISOString()}</timestamp>
</etLog>\`;

    const defaultUserPath = path.join(os.homedir(), '..', 'Default', 'AppData');
    const xmlPath = path.join(defaultUserPath, 'etLog.xml');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(xmlPath), { recursive: true });
    
    // Write the XML file
    fs.writeFileSync(xmlPath, xmlContent, 'utf8');
    
    console.log('XML file saved to:', xmlPath);
    return true;
  } catch (error) {
    console.error('Error saving XML file:', error);
    return false;
  }
}
`;
}
