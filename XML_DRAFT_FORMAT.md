# XML Draft File Format

The XML draft files in `C:\Users\Office\AppData\Local\xml_draft` should contain the following structure to be properly parsed by the application:

## Required Fields
```xml
<citizen_id>1234567890123</citizen_id>
<first_name>John</first_name>
<last_name>Doe</last_name>
<image>base64_encoded_image_data</image>
<father_name>Father Name</father_name>
<mother_name>Mother Name</mother_name>
<gender>Male</gender>
<date_of_birth>1990-01-01</date_of_birth>
<profession>Engineer</profession>
<pakistan_city>Karachi</pakistan_city>
<pakistan_address>123 Main Street, Karachi</pakistan_address>
<birth_country>Pakistan</birth_country>
<birth_city>Karachi</birth_city>
<requested_by>Government</requested_by>
```

## Optional Fields
```xml
<height>5.9</height>
<color_of_eyes>Brown</color_of_eyes>
<color_of_hair>Black</color_of_hair>
<transport_mode>Air</transport_mode>
<reason_for_deport>Emergency</reason_for_deport>
<amount>1000</amount>
<currency>USD</currency>
<investor>Gov of Pakistan</investor>
<security_deposit>Security deposit description</security_deposit>
```

## Biometric Data Fields
```xml
<biometric_data>
    <image_base64>base64_encoded_citizen_photo</image_base64>
    <fingerprint>base64_encoded_fingerprint_image</fingerprint>
    <template>base64_encoded_fingerprint_template</template>
</biometric_data>
```

**Note**: The main citizen photo should be placed in `<biometric_data><image_base64>` for proper extraction.

## Example Complete XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<application>
    <citizen_id>1234567890123</citizen_id>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <image>iVBORw0KGgoAAAANSUhEUgAA...</image>
    <father_name>Robert Doe</father_name>
    <mother_name>Jane Doe</mother_name>
    <gender>Male</gender>
    <date_of_birth>1990-01-01</date_of_birth>
    <profession>Engineer</profession>
    <pakistan_city>Karachi</pakistan_city>
    <pakistan_address>123 Main Street, Karachi</pakistan_address>
    <birth_country>Pakistan</birth_country>
    <birth_city>Karachi</birth_city>
    <departure_date>2024-12-31</departure_date>
    <requested_by>Government</requested_by>
    <height>5.9</height>
    <color_of_eyes>Brown</color_of_eyes>
    <color_of_hair>Black</color_of_hair>
    <transport_mode>Air</transport_mode>
    <reason_for_deport>Emergency</reason_for_deport>
    <amount>1000</amount>
    <currency>USD</currency>
    <investor>Gov of Pakistan</investor>
    <security_deposit>Security deposit description</security_deposit>
    <biometric_data>
        <image_base64>base64_encoded_citizen_photo</image_base64>
        <fingerprint>base64_encoded_fingerprint_data</fingerprint>
        <template>base64_encoded_template_data</template>
    </biometric_data>
</application>
```

## Features

✅ **Automatic Field Population**: All form fields are automatically populated from XML data
✅ **Biometric Data Support**: Fingerprint and biometric data is extracted and stored
✅ **Image Handling**: Citizen photos are loaded and displayed
✅ **Progress Tracking**: Shows current file being processed (e.g., "Load Next File (3/10)")
✅ **Error Handling**: Displays errors if files can't be loaded or parsed
✅ **Data Validation**: Validates citizen ID format and other required fields

## Usage

1. Place XML files in `C:\Users\Office\AppData\Local\xml_draft`
2. The application will automatically count the files
3. Click "Load Next File" to process files in alphabetical order
4. All form fields will be automatically populated
5. Biometric data will be stored for later use
6. The form will automatically trigger GetData to fetch additional information
