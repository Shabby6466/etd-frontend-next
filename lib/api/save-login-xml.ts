import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Create XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<etLog>
  <email>${email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</email>
  <password>${password.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</password>
  <timestamp>${new Date().toISOString()}</timestamp>
</etLog>`;

    // Try to save to secure locations
    let xmlPath;
    let saved = false;
    
    // Try C:\Users\Default\AppData first
    try {
      const defaultUserPath = path.join(os.homedir(), '..', 'Default', 'AppData');
      xmlPath = path.join(defaultUserPath, 'etLog.xml');
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(xmlPath), { recursive: true });
      
      // Write the XML file
      fs.writeFileSync(xmlPath, xmlContent, 'utf8');
      
      console.log('XML file saved to:', xmlPath);
      saved = true;
    } catch (defaultError) {
      console.warn('Failed to save to Default user directory:', defaultError.message);
      
      // Fallback to current user's AppData
      try {
        const userAppData = path.join(os.homedir(), 'AppData', 'Local', 'ETD');
        xmlPath = path.join(userAppData, 'etLog.xml');
        
        // Ensure directory exists
        fs.mkdirSync(path.dirname(xmlPath), { recursive: true });
        
        // Write the XML file
        fs.writeFileSync(xmlPath, xmlContent, 'utf8');
        
        console.log('XML file saved to fallback location:', xmlPath);
        saved = true;
      } catch (fallbackError) {
        console.error('Failed to save to fallback location:', fallbackError.message);
        
        // Final fallback to project directory
        try {
          const projectPath = path.join(process.cwd(), 'logs');
          xmlPath = path.join(projectPath, 'etLog.xml');
          
          // Ensure directory exists
          fs.mkdirSync(path.dirname(xmlPath), { recursive: true });
          
          // Write the XML file
          fs.writeFileSync(xmlPath, xmlContent, 'utf8');
          
          console.log('XML file saved to project logs directory:', xmlPath);
          saved = true;
        } catch (projectError) {
          console.error('Failed to save to project directory:', projectError.message);
        }
      }
    }
    
    if (saved) {
      return NextResponse.json({
        success: true,
        message: 'XML file saved successfully',
        path: xmlPath
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save XML file to any location' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving XML file:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
