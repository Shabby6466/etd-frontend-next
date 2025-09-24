// Offline ETD Application JavaScript
class OfflineETDApp {
    constructor() {
        this.currentUser = null;
        this.biometricData = null;
        this.photoData = null;
        this.fingerprintData = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showLoginScreen();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => this.showLoginScreen());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        // Photo upload
        document.getElementById('photoInput').addEventListener('change', (e) => this.handlePhotoUpload(e));
        document.getElementById('clearPhotoBtn').addEventListener('click', () => this.clearPhoto());
        
        // Fingerprint capture
        document.getElementById('captureFingerprintBtn').addEventListener('click', () => this.showBiometricModal());
        document.getElementById('clearFingerprintBtn').addEventListener('click', () => this.clearFingerprint());
        
        // Biometric modal
        document.getElementById('closeBiometricModal').addEventListener('click', () => this.hideBiometricModal());
        document.getElementById('startCaptureBtn').addEventListener('click', () => this.startBiometricCapture());
        document.getElementById('useFingerprintBtn').addEventListener('click', () => this.useFingerprint());
        document.getElementById('downloadWSQBtn').addEventListener('click', () => this.downloadWSQ());
        document.getElementById('closeBiometricError').addEventListener('click', () => this.hideBiometricError());
        
        // Form submission
        document.getElementById('citizenForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('clearFormBtn').addEventListener('click', () => this.clearForm());
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dataInputScreen').classList.add('hidden');
        this.currentUser = null;
    }

    showDataInputScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dataInputScreen').classList.remove('hidden');
        document.getElementById('userInfo').textContent = `Logged in as: ${this.currentUser.email}`;
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Clear previous errors
        this.hideError('emailError');
        this.hideError('passwordError');
        
        // Basic validation
        if (!email || !password) {
            this.showError('emailError', 'Please enter both email and password');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            return;
        }
        
        // Simulate login
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.currentUser = {
                email: email,
                role: 'OPERATOR'
            };
            
            this.showDataInputScreen();
            this.checkBiometricStatus();
        } catch (error) {
            console.error('Login error:', error);
            this.showError('emailError', 'Login failed. Please try again.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign in';
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.biometricData = null;
        this.photoData = null;
        this.fingerprintData = null;
        this.showLoginScreen();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async checkBiometricStatus() {
        if (!this.currentUser?.email) return;
        
        try {
            const status = {
                isSetup: false,
                isRequired: false
            };
            
            this.updateBiometricStatus(status);
        } catch (error) {
            console.error('Error checking biometric status:', error);
            this.showBiometricError('Failed to check biometric status. Please try again.');
        }
    }

    updateBiometricStatus(status) {
        const statusElement = document.getElementById('biometricStatus');
        const setupStatus = document.getElementById('setupStatus');
        const requiredStatus = document.getElementById('requiredStatus');
        
        if (status.isSetup || status.isRequired) {
            statusElement.classList.remove('hidden');
            
            if (status.isSetup) {
                setupStatus.textContent = 'Setup Complete';
                setupStatus.className = 'px-2 py-1 rounded text-xs bg-green-100 text-green-800';
            } else {
                setupStatus.textContent = 'Not Setup';
                setupStatus.className = 'px-2 py-1 rounded text-xs bg-gray-100 text-gray-600';
            }
            
            if (status.isRequired) {
                requiredStatus.classList.remove('hidden');
            } else {
                requiredStatus.classList.add('hidden');
            }
        } else {
            statusElement.classList.add('hidden');
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Image size must be less than 10MB");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            this.photoData = base64;
            
            const preview = document.getElementById('photoPreview');
            const img = document.getElementById('photoImg');
            const clearBtn = document.getElementById('clearPhotoBtn');
            
            img.src = e.target.result;
            preview.classList.remove('hidden');
            clearBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    clearPhoto() {
        this.photoData = null;
        document.getElementById('photoInput').value = '';
        document.getElementById('photoPreview').classList.add('hidden');
        document.getElementById('clearPhotoBtn').classList.add('hidden');
    }

    showBiometricModal() {
        document.getElementById('biometricModal').classList.remove('hidden');
        this.testBiometricConnection();
    }

    hideBiometricModal() {
        document.getElementById('biometricModal').classList.add('hidden');
        this.resetBiometricModal();
    }

    resetBiometricModal() {
        document.getElementById('modalFingerprintImg').src = '';
        document.getElementById('useFingerprintBtn').classList.add('hidden');
        document.getElementById('downloadWSQBtn').classList.add('hidden');
        document.getElementById('captureStatus').classList.add('hidden');
        document.getElementById('modalError').classList.add('hidden');
        document.getElementById('modalDpi').textContent = '-';
        document.getElementById('modalQuality').textContent = '-';
        document.getElementById('modalNfiq').textContent = '-';
        document.getElementById('wsqInfo').innerHTML = '<p class="pl-2 text-gray-500">Not available</p>';
    }

    async testBiometricConnection() {
        try {
            const response = await fetch('https://localhost:8443/SGIFPCapture?', {
                method: 'GET',
                headers: {
                    'Origin': 'http://172.17.128.145',
                    'Referer': 'http://172.17.128.145/',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                }
            });
            
            if (response.ok) {
                console.log("✅ Biometric service ready");
            }
        } catch (e) {
            console.log("❌ Biometric service connection failed");
        }
    }

    async startBiometricCapture() {
        const startBtn = document.getElementById('startCaptureBtn');
        const status = document.getElementById('captureStatus');
        const error = document.getElementById('modalError');
        
        startBtn.disabled = true;
        startBtn.textContent = 'Capturing...';
        status.classList.remove('hidden');
        error.classList.add('hidden');
        
        try {
            const url = new URL('https://localhost:8443/SGIFPCapture');
            url.searchParams.set('FakeDetection', '0');
            url.searchParams.set('Timeout', '25000');
            url.searchParams.set('TemplateFormat', 'ISO');
            url.searchParams.set('ImageWSQRate', '0.75');
            url.searchParams.set('Quality', '50');

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Origin': 'http://172.17.128.145',
                    'Referer': 'http://172.17.128.145/',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Connection': 'keep-alive',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Capture service HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Biometric capture response:', data);
            
            if (data.ErrorCode === 54) {
                this.showModalError('⚠️ Timeout during WSQ processing. Image captured successfully.');
            } else if (data.ErrorCode !== 0) {
                throw new Error(`Capture failed (code ${data.ErrorCode})`);
            }

            // Display captured image
            const imgB64 = data.ImageDataBase64 || data.BMPBase64 || '';
            if (imgB64) {
                document.getElementById('modalFingerprintImg').src = `data:image/bmp;base64,${imgB64}`;
                document.getElementById('useFingerprintBtn').classList.remove('hidden');
                
                // Update details
                document.getElementById('modalDpi').textContent = data.ImageDPI || '-';
                document.getElementById('modalQuality').textContent = data.ImageQuality || '-';
                document.getElementById('modalNfiq').textContent = data.NFIQ || '-';
                
                // Store biometric data
                this.biometricData = {
                    imageBase64: imgB64,
                    templateBase64: data.TemplateBase64 || '',
                    imageDpi: data.ImageDPI,
                    imageQuality: data.ImageQuality,
                    wsqBase64: data.WSQImage || imgB64,
                    wsqSize: data.WSQImageSize,
                    deviceModel: data.Model,
                    serial: data.SerialNumber
                };
                
                // Show WSQ info if available
                if (data.WSQImage) {
                    this.updateWSQInfo(data.WSQImageSize, data.WSQImage.length);
                    document.getElementById('downloadWSQBtn').classList.remove('hidden');
                } else {
                    this.updateWSQInfo(0, 0, 'Not available from service');
                }
            }
            
        } catch (error) {
            console.error('Biometric capture error:', error);
            let errorMsg = 'Failed to start capture';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMsg = 'Cannot connect to SecuGen WebAPI. Please ensure:\n• SgiBioSrv service is running\n• Device is connected\n• Browser allows localhost connections';
            } else if (error.message.includes('HTTP 404')) {
                errorMsg = 'SecuGen WebAPI not found. Please install SgiBioSrv from https://webapi.secugen.com/';
            } else if (error.message.includes('HTTP 500')) {
                errorMsg = 'SecuGen WebAPI error. Check device connection and drivers.';
            } else {
                errorMsg = error.message;
            }
            
            this.showModalError(errorMsg);
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'Capture';
            status.classList.add('hidden');
        }
    }

    updateWSQInfo(size, length, status = 'Available') {
        const wsqInfo = document.getElementById('wsqInfo');
        if (status === 'Available' && size > 0) {
            wsqInfo.innerHTML = `
                <p class="pl-2">• Size: ${size} bytes</p>
                <p class="pl-2">• Data: ${length} chars</p>
            `;
        } else {
            wsqInfo.innerHTML = `<p class="pl-2 text-gray-500">• ${status}</p>`;
        }
    }

    useFingerprint() {
        if (!this.biometricData) return;
        
        // Update main form with fingerprint data
        this.fingerprintData = this.biometricData;
        
        // Show fingerprint preview in main form
        const preview = document.getElementById('fingerprintPreview');
        const img = document.getElementById('fingerprintImg');
        const clearBtn = document.getElementById('clearFingerprintBtn');
        
        img.src = `data:image/bmp;base64,${this.biometricData.imageBase64}`;
        preview.classList.remove('hidden');
        clearBtn.classList.remove('hidden');
        
        // Update biometric details
        this.updateBiometricDetails();
        
        // Register biometric if user is logged in
        if (this.currentUser?.email && this.biometricData.templateBase64) {
            this.registerBiometric();
        }
        
        this.hideBiometricModal();
    }

    updateBiometricDetails() {
        if (!this.biometricData) return;
        
        const details = document.getElementById('biometricDetails');
        const quality = document.getElementById('biometricQuality');
        const device = document.getElementById('biometricDevice');
        const template = document.getElementById('biometricTemplate');
        const wsq = document.getElementById('biometricWSQ');
        
        quality.textContent = `Quality: ${this.biometricData.imageQuality || 'N/A'} | DPI: ${this.biometricData.imageDpi || 'N/A'}`;
        device.textContent = `Device: ${this.biometricData.deviceModel || 'Unknown'}`;
        template.textContent = `Template: ${this.biometricData.templateBase64 ? 'Available' : 'Not available'}`;
        wsq.textContent = `WSQ: ${this.biometricData.wsqBase64 ? 'Available' : 'Not available'}`;
        
        details.classList.remove('hidden');
    }

    async registerBiometric() {
        if (!this.currentUser?.email || !this.biometricData?.templateBase64) return;
        
        try {
            // Simulate biometric registration
            console.log('Registering biometric data for user:', this.currentUser.email);
            
            // Update biometric status
            this.updateBiometricStatus({
                isSetup: true,
                isRequired: false
            });
            
        } catch (error) {
            console.error('Error registering biometric data:', error);
            this.showBiometricError('Failed to register biometric data. Data captured locally.');
        }
    }

    clearFingerprint() {
        this.fingerprintData = null;
        this.biometricData = null;
        document.getElementById('fingerprintPreview').classList.add('hidden');
        document.getElementById('clearFingerprintBtn').classList.add('hidden');
        document.getElementById('biometricDetails').classList.add('hidden');
        this.hideBiometricError();
    }

    downloadWSQ() {
        if (!this.biometricData?.wsqBase64) return;
        
        try {
            const byteCharacters = atob(this.biometricData.wsqBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/octet-stream' });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const serial = this.biometricData.serial?.trim() || 'unknown';
            link.download = `fingerprint_${serial}_${timestamp}.wsq`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`WSQ file downloaded: ${link.download}`);
        } catch (error) {
            console.error('Failed to download WSQ file:', error);
            this.showModalError('Failed to download WSQ file');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Validate required fields
            const validation = this.validateForm(formData);
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Form submitted:', {
                ...formData,
                hasPhoto: !!this.photoData,
                hasFingerprint: !!this.fingerprintData,
                biometricData: this.biometricData
            });
            
            alert('Application created successfully!');
            this.clearForm();
            
        } catch (error) {
            console.error('Error creating application:', error);
            alert('Error creating application');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Application';
        }
    }

    collectFormData() {
        return {
            citizen_id: document.getElementById('citizen_id').value,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            father_name: document.getElementById('father_name').value,
            mother_name: document.getElementById('mother_name').value,
            gender: document.getElementById('gender').value,
            date_of_birth: document.getElementById('date_of_birth').value,
            profession: document.getElementById('profession').value,
            pakistan_city: document.getElementById('pakistan_city').value,
            pakistan_address: document.getElementById('pakistan_address').value,
            birth_country: document.getElementById('birth_country').value,
            birth_city: document.getElementById('birth_city').value,
            departure_date: document.getElementById('departure_date').value,
            requested_by: document.getElementById('requested_by').value,
            height: document.getElementById('height').value,
            color_of_eyes: document.getElementById('color_of_eyes').value,
            color_of_hair: document.getElementById('color_of_hair').value,
            transport_mode: document.getElementById('transport_mode').value,
            investor: document.getElementById('investor').value,
            reason_for_deport: document.getElementById('reason_for_deport').value,
            amount: document.getElementById('amount').value,
            currency: document.getElementById('currency').value,
            image: this.photoData,
            fingerprint: this.fingerprintData?.imageBase64 || '',
            fingerprintTemplate: this.fingerprintData?.templateBase64 || '',
            fingerprintDevice: this.fingerprintData?.deviceModel || '',
            wsqFingerprint: this.fingerprintData?.wsqBase64 || '',
            fingerprintDeviceSerial: this.fingerprintData?.serial || '',
            fingerprintDpi: this.fingerprintData?.imageDpi,
            fingerprintQuality: this.fingerprintData?.imageQuality
        };
    }

    validateForm(data) {
        const errors = {};
        
        // Required fields validation
        const requiredFields = [
            'citizen_id', 'first_name', 'last_name', 'father_name', 'mother_name',
            'gender', 'date_of_birth', 'profession', 'pakistan_city', 'pakistan_address',
            'birth_country', 'birth_city', 'departure_date', 'requested_by'
        ];
        
        requiredFields.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                errors[field] = `${this.getFieldLabel(field)} is required`;
            }
        });
        
        // Citizen ID validation
        if (data.citizen_id && !/^\d{13}$/.test(data.citizen_id)) {
            errors.citizen_id = 'Citizen ID must be exactly 13 digits';
        }
        
        // Photo validation
        if (!data.image) {
            errors.image = 'Photo is required';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    getFieldLabel(field) {
        const labels = {
            citizen_id: 'Citizen ID',
            first_name: 'First Name',
            last_name: 'Last Name',
            father_name: 'Father\'s Name',
            mother_name: 'Mother\'s Name',
            gender: 'Gender',
            date_of_birth: 'Date of Birth',
            profession: 'Profession',
            pakistan_city: 'City',
            pakistan_address: 'Address',
            birth_country: 'Birth Country',
            birth_city: 'Birth City',
            departure_date: 'Departure Date',
            requested_by: 'Requested By'
        };
        return labels[field] || field;
    }

    showValidationErrors(errors) {
        // Clear previous errors
        const errorElements = document.querySelectorAll('[id$="Error"]');
        errorElements.forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
        
        // Show new errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.classList.remove('hidden');
            }
        });
    }

    clearForm() {
        // Reset form
        document.getElementById('citizenForm').reset();
        
        // Clear photo
        this.clearPhoto();
        
        // Clear fingerprint
        this.clearFingerprint();
        
        // Clear biometric data
        this.biometricData = null;
        this.fingerprintData = null;
        this.photoData = null;
        
        // Clear errors
        const errorElements = document.querySelectorAll('[id$="Error"]');
        errorElements.forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
        
        this.hideBiometricError();
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
            element.textContent = '';
        }
    }

    showBiometricError(message) {
        const errorElement = document.getElementById('biometricError');
        const errorText = document.getElementById('biometricErrorText');
        
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideBiometricError() {
        document.getElementById('biometricError').classList.add('hidden');
    }

    showModalError(message) {
        const errorElement = document.getElementById('modalError');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new OfflineETDApp();
});
