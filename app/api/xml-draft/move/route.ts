import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();
    
    if (!fileName) {
      return NextResponse.json({ 
        success: false, 
        message: 'File name is required' 
      }, { status: 400 });
    }

    const xmlDraftPath = 'C:\\Users\\Office\\AppData\\Local\\xml_draft';
    const xmlSubmitPath = 'C:\\Users\\Office\\AppData\\Local\\xml_submit';
    
    // Create xml_submit directory if it doesn't exist
    if (!fs.existsSync(xmlSubmitPath)) {
      fs.mkdirSync(xmlSubmitPath, { recursive: true });
    }
    
    const sourceFile = path.join(xmlDraftPath, fileName);
    const destinationFile = path.join(xmlSubmitPath, fileName);
    
    // Check if source file exists
    if (!fs.existsSync(sourceFile)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Source file not found' 
      }, { status: 404 });
    }
    
    // Move the file
    fs.renameSync(sourceFile, destinationFile);
    
    console.log(`File moved successfully: ${fileName} from xml_draft to xml_submit`);
    
    return NextResponse.json({
      success: true,
      message: `File ${fileName} moved to xml_submit folder successfully`
    });
  } catch (error) {
    console.error('Error moving XML file:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error moving file' 
    }, { status: 500 });
  }
}
