// Configuration for Offline ETD Application
const ETDConfig = {
    // Biometric service configuration
    biometric: {
        endpoint: 'https://localhost:8443/SGIFPCapture',
        timeout: 25000,
        quality: 50,
        wsqRate: 0.75,
        templateFormat: 'ISO',
        fakeDetection: false
    },
    
    // Form validation rules
    validation: {
        citizenIdLength: 13,
        maxPhotoSize: 10 * 1024 * 1024, // 10MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    
    // Application settings
    app: {
        name: 'Emergency Travel Document',
        version: '1.0.0',
        debug: false
    },
    
    // Mock data for testing
    mockUsers: [
        {
            email: 'admin@etd.gov.pk',
            password: 'admin123',
            role: 'ADMIN'
        },
        {
            email: 'operator@etd.gov.pk',
            password: 'operator123',
            role: 'OPERATOR'
        },
        {
            email: 'agency@etd.gov.pk',
            password: 'agency123',
            role: 'AGENCY'
        }
    ],
    
    // Default form values for testing
    defaultFormData: {
        citizen_id: '',
        first_name: '',
        last_name: '',
        father_name: '',
        mother_name: '',
        gender: '',
        date_of_birth: '',
        profession: '',
        pakistan_city: '',
        pakistan_address: '',
        birth_country: 'Pakistan',
        birth_city: '',
        departure_date: '',
        requested_by: '',
        height: '',
        color_of_eyes: '',
        color_of_hair: '',
        transport_mode: 'Air',
        investor: 'Gov of Pakistan',
        reason_for_deport: '',
        amount: 0,
        currency: 'PKR'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ETDConfig;
}
