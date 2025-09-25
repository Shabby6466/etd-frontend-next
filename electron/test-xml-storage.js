// This test file is for Node.js testing only
// For Electron testing, use the actual application

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Test data
const testApplicationData = {
  citizen_id: "1234567890123",
  first_name: "John",
  last_name: "Doe",
  father_name: "Robert Doe",
  mother_name: "Jane Doe",
  gender: "M",
  date_of_birth: "1990-01-01",
  profession: "Engineer",
  pakistan_city: "Karachi",
  pakistan_address: "123 Main Street, Karachi",
  birth_country: "Pakistan",
  birth_city: "Karachi",
  departure_date: "2024-12-01",
  requested_by: "Self",
  height: "5.9",
  color_of_eyes: "Brown",
  color_of_hair: "Black",
  transport_mode: "Air",
  investor: "Gov of Pakistan",
  reason_for_deport: "Emergency",
  amount: 1000,
  currency: "USD",
  image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 pixel PNG
  fingerprint: "fingerprint_base64_data_here",
  fingerprintTemplate: "template_base64_data_here",
  fingerprintDevice: "SecuGen",
  wsqFingerprint: "wsq_base64_data_here",
  fingerprintDeviceSerial: "SG001234",
  fingerprintDpi: 500,
  fingerprintQuality: 95,
  biometricData: {
    wsqFingerprint: "wsq_base64_data_here",
    fingerprintTemplateBase64: "template_base64_data_here",
    fingerprintDeviceModel: "SecuGen Hamster Pro",
    fingerprintDeviceSerial: "SG001234",
    imageDpi: 500,
    imageQuality: 95
  }
};

// Helper function to generate XML content (same as in main.js)
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
    <departure_date>${escapeXML(data.departure_date)}</departure_date>
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

async function testXMLStorage() {
  try {
    console.log('Testing XML Storage (Node.js version)...');
    
    const storageDir = path.join(os.homedir(), 'AppData', 'Local', 'xml_draft');
    console.log('Storage directory:', storageDir);
    
    // Ensure directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log('Created storage directory');
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
    const filename = `${nextSequence}_${testApplicationData.citizen_id}_${Date.now()}.xml`;
    const filepath = path.join(storageDir, filename);
    
    // Generate XML content
    const xmlContent = generateXMLContent(testApplicationData);
    
    // Write file
    fs.writeFileSync(filepath, xmlContent, 'utf8');
    
    console.log('✅ Application saved successfully to:', filepath);
    
    // Test reading the file
    const readContent = fs.readFileSync(filepath, 'utf8');
    console.log('✅ Successfully read application XML');
    console.log('XML Preview (first 500 chars):', readContent.substring(0, 500) + '...');
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testXMLStorage();
