import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const xmlDraftPath = 'C:\\Users\\Office\\AppData\\Local\\xml_draft';
    
    // Check if directory exists
    if (!fs.existsSync(xmlDraftPath)) {
      return NextResponse.json({ 
        success: false, 
        message: 'XML draft folder not found',
        fileCount: 0,
        files: []
      });
    }

    // Read directory contents
    const files = fs.readdirSync(xmlDraftPath);
    const xmlFiles = files.filter(file => file.toLowerCase().endsWith('.xml'));
    
    return NextResponse.json({
      success: true,
      fileCount: xmlFiles.length,
      files: xmlFiles.sort() // Sort files for consistent ordering
    });
  } catch (error) {
    console.error('Error reading XML draft folder:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error reading XML draft folder',
      fileCount: 0,
      files: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, fileName } = await request.json();
    const xmlDraftPath = 'C:\\Users\\Office\\AppData\\Local\\xml_draft';
    
    if (action === 'loadFile') {
      if (!fileName) {
        return NextResponse.json({ 
          success: false, 
          message: 'File name is required' 
        }, { status: 400 });
      }

      const filePath = path.join(xmlDraftPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ 
          success: false, 
          message: 'File not found' 
        }, { status: 404 });
      }

      // Read and parse XML file
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse XML to extract all relevant data
      const extractField = (fieldName: string) => {
        const regex = new RegExp(`<${fieldName}[^>]*>([^<]+)<\/${fieldName}>`, 'i');
        const match = xmlContent.match(regex);
        return match ? match[1].trim() : '';
      };

      const extractOptionalField = (fieldName: string) => {
        const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)<\/${fieldName}>`, 'i');
        const match = xmlContent.match(regex);
        return match ? match[1].trim() : '';
      };

      // Extract biometric data separately
      const biometricDataMatch = xmlContent.match(/<biometric_data[^>]*>([\s\S]*?)<\/biometric_data>/i);
      let biometricImageBase64 = '';
      let biometricFingerprint = '';
      let biometricTemplate = '';
      
      if (biometricDataMatch) {
        const biometricContent = biometricDataMatch[1];
        
        // Extract image from biometric_data
        const imageMatch = biometricContent.match(/<image_base64[^>]*>([^<]+)<\/image_base64>/i);
        if (imageMatch) {
          biometricImageBase64 = imageMatch[1].trim();
        }
        
        // Extract fingerprint from biometric_data
        const fingerprintMatch = biometricContent.match(/<fingerprint[^>]*>([^<]+)<\/fingerprint>/i);
        if (fingerprintMatch) {
          biometricFingerprint = fingerprintMatch[1].trim();
        }
        
        // Extract template from biometric_data
        const templateMatch = biometricContent.match(/<template[^>]*>([^<]+)<\/template>/i);
        if (templateMatch) {
          biometricTemplate = templateMatch[1].trim();
        }
      }

      const extractedData = {
        // Required fields
        citizenId: extractField('citizen_id'),
        firstName: extractField('first_name'),
        lastName: extractField('last_name'),
        imageBase64: biometricImageBase64 || extractField('image'), // Use biometric image first, fallback to regular image
        fatherName: extractField('father_name'),
        motherName: extractField('mother_name'),
        gender: extractField('gender'),
        dateOfBirth: extractField('date_of_birth'),
        profession: extractField('profession'),
        pakistanCity: extractField('pakistan_city'),
        pakistanAddress: extractField('pakistan_address'),
        birthCountry: extractField('birth_country'),
        birthCity: extractField('birth_city'),
        departureDate: extractField('departure_date'),
        requestedBy: extractField('requested_by'),
        
        // Optional fields
        height: extractOptionalField('height'),
        colorOfEyes: extractOptionalField('color_of_eyes'),
        colorOfHair: extractOptionalField('color_of_hair'),
        transportMode: extractOptionalField('transport_mode'),
        reasonForDeport: extractOptionalField('reason_for_deport'),
        amount: extractOptionalField('amount'),
        currency: extractOptionalField('currency'),
        investor: extractOptionalField('investor'),
        securityDeposit: extractOptionalField('security_deposit'),
        
        // Biometric data (prioritize biometric_data section)
        fingerprint: biometricFingerprint || extractOptionalField('fingerprint'),
        fingerprintTemplate: biometricTemplate || extractOptionalField('fingerprint_template'),
        biometricImage: biometricImageBase64 || extractOptionalField('biometric_image'),
        
        // Additional data
        xmlContent: xmlContent
      };

      console.log("XML parsing result:", {
        hasImage: !!extractedData.imageBase64,
        imageLength: extractedData.imageBase64?.length || 0,
        citizenId: extractedData.citizenId,
        biometricImageFound: !!biometricImageBase64,
        biometricFingerprintFound: !!biometricFingerprint
      });

      return NextResponse.json({
        success: true,
        data: extractedData
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error processing XML draft file:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error processing XML file' 
    }, { status: 500 });
  }
}
