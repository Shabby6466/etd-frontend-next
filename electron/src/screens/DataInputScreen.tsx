import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Import local icon components to avoid dependency issues
import { ArrowLeft, ChevronDown } from '../components/Icons';
import { User } from '../App';
import BiometricCaptureModal from '../components/BiometricCaptureModal';
import { biometricAPI, BiometricData } from '../api/biometric';
import { XMLStorage, ApplicationData } from '../utils/xmlStorage';

// Simplified schema for Electron app
const citizenSchema = z.object({
  citizen_id: z.string().regex(/^\d{13}$/, "Citizen ID must be exactly 13 digits"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  father_name: z.string().min(1, "Father's name is required"),
  mother_name: z.string().min(1, "Mother's name is required"),
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  profession: z.string().min(1, "Profession is required"),
  pakistan_city: z.string().min(1, "City is required"),
  pakistan_address: z.string().min(1, "Address is required"),
  birth_country: z.string().min(1, "Birth country is required"),
  birth_city: z.string().min(1, "Birth city is required"),
  departure_date: z.string().min(1, "Departure date is required"),
  requested_by: z.string().min(1, "Requested by is required"),
  height: z.string().optional(),
  color_of_eyes: z.string().optional(),
  color_of_hair: z.string().optional(),
  transport_mode: z.string().optional(),
  investor: z.string().optional(),
  reason_for_deport: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  image: z.string().min(1, "Photo is required"),
  fingerprint: z.string().optional(),
  fingerprintTemplate: z.string().optional(),
  fingerprintDevice: z.string().optional(),
  wsqFingerprint: z.string().optional(),
  fingerprintDeviceSerial: z.string().optional(),
  fingerprintDpi: z.number().optional(),
  fingerprintQuality: z.number().optional(),
});

type CitizenFormData = z.infer<typeof citizenSchema>;

interface DataInputScreenProps {
  user: User | null;
  onLogout: () => void;
  onBack: () => void;
}

const DataInputScreen: React.FC<DataInputScreenProps> = ({ user, onLogout, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fingerprintPreview, setFingerprintPreview] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<{
    isSetup: boolean;
    isRequired: boolean;
  } | null>(null);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema),
    defaultValues: {
      citizen_id: "",
      first_name: "",
      last_name: "",
      father_name: "",
      mother_name: "",
      gender: "",
      date_of_birth: "",
      profession: "",
      pakistan_city: "",
      pakistan_address: "",
      birth_country: "",
      birth_city: "",
      departure_date: "",
      requested_by: "",
      height: "",
      color_of_eyes: "",
      color_of_hair: "",
      transport_mode: "",
      investor: "",
      reason_for_deport: "",
      amount: 0,
      currency: "",
      image: "",
      fingerprint: "",
      fingerprintTemplate: "",
      fingerprintDevice: "",
      wsqFingerprint: "",
      fingerprintDeviceSerial: "",
      fingerprintDpi: undefined,
      fingerprintQuality: undefined,
    },
  });

  // Effect to check biometric status when component mounts
  useEffect(() => {
    if (user?.email) {
      checkBiometricStatus();
    }
  }, [user]);

  const checkBiometricStatus = async () => {
    if (!user?.email) return;
    
    setIsBiometricLoading(true);
    setBiometricError(null);
    
    try {
      const status = await biometricAPI.getBiometricStatus(user.email);
      setBiometricStatus({
        isSetup: status.isBiometricSetup,
        isRequired: status.isBiometricRequired
      });
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricError('Failed to check biometric status. Please try again.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      event.target.value = "";
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      event.target.value = "";
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
      form.setValue("image", base64);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error processing image");
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFingerprintCapture = () => {
    setBiometricError(null);
    setShowBiometricModal(true);
  };

  const handleFingerprintCaptured = async (data: {
    imageBase64: string;
    templateBase64?: string;
    imageDpi?: number;
    imageQuality?: number;
    wsqBase64?: string;
    wsqSize?: number;
    deviceModel?: string;
    serial?: string;
  }) => {
    setFingerprintPreview(`data:image/bmp;base64,${data.imageBase64}`);
    
    const bioData: BiometricData = {
      wsqFingerprint: data.wsqBase64 || data.imageBase64,
      fingerprintTemplateBase64: data.templateBase64 || "",
      fingerprintDeviceModel: data.deviceModel,
      fingerprintDeviceSerial: data.serial,
      imageDpi: data.imageDpi,
      imageQuality: data.imageQuality
    };
    
    setBiometricData(bioData);
    
    // Update form fields
    form.setValue("fingerprint", data.imageBase64);
    form.setValue("fingerprintTemplate", data.templateBase64 || "");
    form.setValue("fingerprintDevice", data.deviceModel || "");
    form.setValue("wsqFingerprint", data.wsqBase64 || data.imageBase64);
    form.setValue("fingerprintDeviceSerial", data.serial || "");
    form.setValue("fingerprintDpi", data.imageDpi);
    form.setValue("fingerprintQuality", data.imageQuality);
    
    console.log("Fingerprint captured:", {
      imageSize: data.imageBase64.length,
      templateSize: data.templateBase64?.length,
      quality: data.imageQuality,
      device: data.deviceModel,
      serial: data.serial,
      wsqSize: data.wsqBase64?.length || 0
    });
    
    // Register biometric data if user is logged in
    if (user?.email && bioData.fingerprintTemplateBase64) {
      setBiometricError(null);
      setIsBiometricLoading(true);
      
      try {
        await biometricAPI.registerBiometric({
          userId: user.email,
          biometricData: bioData
        });
        console.log('Biometric data registered successfully');
        
        // Update biometric status after successful registration
        await checkBiometricStatus();
      } catch (error) {
        console.error('Error registering biometric data:', error);
        setBiometricError('Failed to register biometric data. Data captured locally.');
      } finally {
        setIsBiometricLoading(false);
      }
    }
    
    setShowBiometricModal(false);
  };

  const clearFingerprint = () => {
    setFingerprintPreview(null);
    setBiometricData(null);
    setBiometricError(null);
    form.setValue("fingerprint", "");
    form.setValue("fingerprintTemplate", "");
    form.setValue("fingerprintDevice", "");
    form.setValue("wsqFingerprint", "");
    form.setValue("fingerprintDeviceSerial", "");
    form.setValue("fingerprintDpi", undefined);
    form.setValue("fingerprintQuality", undefined);
  };

  const onSubmit = async (data: CitizenFormData) => {
    setIsLoading(true);
    try {
      // Prepare submission data with biometric information
      const submissionData: ApplicationData = {
        citizen_id: data.citizen_id,
        first_name: data.first_name,
        last_name: data.last_name,
        father_name: data.father_name,
        mother_name: data.mother_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        profession: data.profession,
        pakistan_city: data.pakistan_city,
        pakistan_address: data.pakistan_address,
        birth_country: data.birth_country,
        birth_city: data.birth_city,
        departure_date: data.departure_date,
        requested_by: data.requested_by,
        height: data.height,
        color_of_eyes: data.color_of_eyes,
        color_of_hair: data.color_of_hair,
        transport_mode: data.transport_mode,
        investor: data.investor,
        reason_for_deport: data.reason_for_deport,
        amount: data.amount,
        currency: data.currency,
        image: data.image,
        fingerprint: data.fingerprint,
        fingerprintTemplate: data.fingerprintTemplate,
        fingerprintDevice: data.fingerprintDevice,
        wsqFingerprint: data.wsqFingerprint,
        fingerprintDeviceSerial: data.fingerprintDeviceSerial,
        fingerprintDpi: data.fingerprintDpi,
        fingerprintQuality: data.fingerprintQuality,
        // Include biometric data if available
        biometricData: biometricData ? {
          wsqFingerprint: biometricData.wsqFingerprint,
          fingerprintTemplateBase64: biometricData.fingerprintTemplateBase64,
          fingerprintDeviceModel: biometricData.fingerprintDeviceModel,
          fingerprintDeviceSerial: biometricData.fingerprintDeviceSerial,
          imageDpi: biometricData.imageDpi,
          imageQuality: biometricData.imageQuality
        } : null
      };
      
      try {
        await XMLStorage.saveApplication(submissionData);
        alert(`Application Saved`);
      } catch (saveError) {
        console.error('Error saving application:', saveError);
        alert(`Application failed to save`);
      }
      
      form.reset();
      setImagePreview(null);
      setFingerprintPreview(null);
      setBiometricData(null);
      setBiometricError(null);
    } catch (error) {
      console.error("Error creating application:", error);
      alert(`Error creating application: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dashboardBackgroundColor">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Emergency Travel Document Application</h1>
              <p className="text-gray-600">Enter citizen information to create a new application</p>
              {user && <p className="text-sm text-gray-500">Logged in as: {user.email}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="citizen_id" className="block text-sm font-medium text-gray-700 mb-1">
                Citizen ID *
              </label>
              <input
                id="citizen_id"
                placeholder="Enter 13-digit citizen ID"
                maxLength={13}
                {...form.register("citizen_id")}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  form.formState.errors.citizen_id ? "border-red-500" : "border-gray-300"
                }`}
              />
              {form.formState.errors.citizen_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.citizen_id.message}
                </p>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-lg font-semibold mb-4">Photograph *</label>
              
              {imagePreview && (
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-2 rounded">
                    <img
                      src={imagePreview}
                      alt="Citizen Photo"
                      className="w-32 h-40 object-cover rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      form.setValue("image", "");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-2 text-center">
                Upload a clear photo (max 10MB)
              </p>
              
              {form.formState.errors.image && (
                <p className="text-sm text-red-500 mt-1 text-center">
                  {form.formState.errors.image.message}
                </p>
              )}
            </div>

            {/* Fingerprint Capture Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-lg font-semibold">Fingerprint Capture</label>
                <div className="flex items-center gap-2">
                  {isBiometricLoading && (
                    <div className="text-sm text-blue-600">Loading...</div>
                  )}
                  {biometricStatus && (
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        biometricStatus.isSetup 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {biometricStatus.isSetup ? 'Setup Complete' : 'Not Setup'}
                      </span>
                      {biometricStatus.isRequired && (
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                          Required
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Biometric Error Display */}
              {biometricError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-600 text-sm">⚠️ {biometricError}</span>
                    <button
                      type="button"
                      onClick={() => setBiometricError(null)}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              {fingerprintPreview && (
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-2 rounded">
                    <img
                      src={fingerprintPreview}
                      alt="Fingerprint"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleFingerprintCapture}
                  disabled={isBiometricLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBiometricLoading 
                    ? "Processing..." 
                    : fingerprintPreview 
                      ? "Recapture Fingerprint" 
                      : "Capture Fingerprint"
                  }
                </button>
                
                {fingerprintPreview && (
                  <button
                    type="button"
                    onClick={clearFingerprint}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Clear Fingerprint
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 mt-2 text-center space-y-1">
                <p>Optional: Capture fingerprint for enhanced security</p>
                {biometricData && (
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <p><strong>Capture Details:</strong></p>
                    <p>Quality: {biometricData.imageQuality || 'N/A'} | DPI: {biometricData.imageDpi || 'N/A'}</p>
                    <p>Device: {biometricData.fingerprintDeviceModel || 'Unknown'}</p>
                    <p>Template: {biometricData.fingerprintTemplateBase64 ? 'Available' : 'Not available'}</p>
                    <p>WSQ: {biometricData.wsqFingerprint ? 'Available' : 'Not available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="first_name"
                  {...form.register("first_name")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.first_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  {...form.register("last_name")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.last_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="father_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Name *
                </label>
                <input
                  id="father_name"
                  {...form.register("father_name")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.father_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.father_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.father_name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="mother_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Mother's Name *
                </label>
                <input
                  id="mother_name"
                  {...form.register("mother_name")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.mother_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.mother_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.mother_name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    {...form.register("gender")}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                      form.formState.errors.gender ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="X">Transgender</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-3 text-gray-500 h-4 w-4 pointer-events-none" />
                </div>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  {...form.register("date_of_birth")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.date_of_birth ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.date_of_birth && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.date_of_birth.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address & Birth Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birth_country" className="block text-sm font-medium text-gray-700 mb-1">
                  Birth Country *
                </label>
                <input
                  id="birth_country"
                  {...form.register("birth_country")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.birth_country ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.birth_country && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.birth_country.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="birth_city" className="block text-sm font-medium text-gray-700 mb-1">
                  Birth City *
                </label>
                <input
                  id="birth_city"
                  {...form.register("birth_city")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.birth_city ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.birth_city && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.birth_city.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pakistan_city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="pakistan_city"
                  {...form.register("pakistan_city")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.pakistan_city ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.pakistan_city && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.pakistan_city.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
                  Profession *
                </label>
                <input
                  id="profession"
                  {...form.register("profession")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.profession ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.profession && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.profession.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="pakistan_address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  id="pakistan_address"
                  {...form.register("pakistan_address")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.pakistan_address ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.pakistan_address && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.pakistan_address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height
                </label>
                <input
                  id="height"
                  placeholder="e.g., 5.9"
                  {...form.register("height")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="color_of_eyes" className="block text-sm font-medium text-gray-700 mb-1">
                  Eye Color
                </label>
                <input
                  id="color_of_eyes"
                  {...form.register("color_of_eyes")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="color_of_hair" className="block text-sm font-medium text-gray-700 mb-1">
                  Hair Color
                </label>
                <input
                  id="color_of_hair"
                  {...form.register("color_of_hair")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Travel & Request Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departure_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date *
                </label>
                <input
                  id="departure_date"
                  type="date"
                  {...form.register("departure_date")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.departure_date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.departure_date && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.departure_date.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="requested_by" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested By *
                </label>
                <input
                  id="requested_by"
                  {...form.register("requested_by")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    form.formState.errors.requested_by ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {form.formState.errors.requested_by && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.requested_by.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="transport_mode" className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Mode
                </label>
                <input
                  id="transport_mode"
                  placeholder="e.g., Air, Road, Sea"
                  {...form.register("transport_mode")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="investor" className="block text-sm font-medium text-gray-700 mb-1">
                  Investor
                </label>
                <input
                  id="investor"
                  placeholder="Gov of Pakistan"
                  {...form.register("investor")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="reason_for_deport" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Deport
                </label>
                <input
                  id="reason_for_deport"
                  {...form.register("reason_for_deport")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register("amount", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  id="currency"
                  {...form.register("currency")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                    onClick={() => {
                      form.reset();
                      setImagePreview(null);
                      setFingerprintPreview(null);
                      setBiometricData(null);
                      setBiometricError(null);
                    }}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Biometric Capture Modal */}
      <BiometricCaptureModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onCaptured={handleFingerprintCaptured}
      />
    </div>
  );
};

export default DataInputScreen;
