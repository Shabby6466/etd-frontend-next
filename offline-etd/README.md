# Offline ETD Application

A static HTML/JavaScript application for Emergency Travel Document data collection with biometric capture capabilities.

## Features

- **User Authentication**: Simple login system
- **Data Collection**: Complete citizen information form
- **Photo Upload**: Image capture and preview with validation
- **Biometric Capture**: Fingerprint capture using SecuGen devices
- **Offline Operation**: Works without internet connection
- **Responsive Design**: Mobile-friendly interface

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- SecuGen biometric device (optional, for fingerprint capture)
- SecuGen WebAPI service (for biometric functionality)

## Installation

1. Clone or download the `offline-etd` directory
2. Open `index.html` in a web browser
3. For biometric functionality, ensure SecuGen WebAPI is running on `https://localhost:8443`

## Usage

### Login
1. Enter email and password
2. Click "Sign in" to access the application

### Data Entry
1. Fill in all required citizen information
2. Upload a clear photo (max 10MB)
3. Optionally capture fingerprint using biometric device
4. Submit the form

### Biometric Capture
1. Click "Capture Fingerprint" to open the biometric modal
2. Click "Capture" to start fingerprint capture
3. Place finger on the SecuGen device
4. Review captured data and click "Use This" to apply
5. Optionally download WSQ file

## File Structure

```
offline-etd/
├── index.html          # Main application file
├── js/
│   └── app.js         # Application logic
└── README.md          # This file
```

## Configuration

### Biometric Service
The application connects to SecuGen WebAPI at `https://localhost:8443/SGIFPCapture`. To change this:

1. Edit the `endpoint` variable in `js/app.js`
2. Update the `testBiometricConnection()` and `startBiometricCapture()` methods

### API Integration
The application includes mock API calls. To integrate with a real backend:

1. Update the `registerBiometric()` method in `js/app.js`
2. Modify the `handleFormSubmit()` method to send data to your API
3. Update the `checkBiometricStatus()` method for real status checks

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Notes

- The application runs locally and doesn't require internet connection
- Biometric data is processed locally
- No data is sent to external servers unless configured
- Use HTTPS for production deployments

## Troubleshooting

### Biometric Issues
- Ensure SecuGen WebAPI service is running
- Check device connection and drivers
- Verify browser allows localhost connections
- Check console for detailed error messages

### Photo Upload Issues
- Ensure file is a valid image format
- Check file size is under 10MB
- Verify browser supports FileReader API

### Form Validation
- All required fields must be filled
- Citizen ID must be exactly 13 digits
- Photo is mandatory for submission

## Development

### Adding New Fields
1. Add HTML input in `index.html`
2. Update `collectFormData()` method in `js/app.js`
3. Add validation in `validateForm()` method if needed

### Customizing Styling
- Modify CSS classes in `index.html`
- Update Tailwind CSS classes for styling
- Add custom CSS in the `<style>` section

### Extending Functionality
- Add new methods to the `OfflineETDApp` class
- Update event listeners in `setupEventListeners()`
- Modify form submission logic as needed

## License

This application is part of the ETD (Emergency Travel Document) system.
