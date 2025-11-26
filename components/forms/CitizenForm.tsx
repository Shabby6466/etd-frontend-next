"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showNotification } from "@/lib/utils/notifications";
import { citizenSchema, type CitizenFormData } from "@/lib/validations/citizen";
import { applicationAPI } from "@/lib/api/applications";
import { nadraAPI } from "@/lib/api/nadra";
import { passportAPI, type PassportApiResponse } from "@/lib/api/passport";
import { useAuthStore } from "@/lib/stores/auth-store";
import { DGIPHeaderWithWatermarks } from "@/components/ui/dgip_header_watermarks";
import ETDApplicationPhotoCard from "@/components/ui/etd_application_photo_card";
import { DetailForm } from "@/components/forms/DetailForm";
import { ArrowLeft, ChevronDown, FolderOpen, FileText } from "lucide-react";
import { ImageEditorModal } from "@/components/ui/ImageEditorModal";
import BiometricCaptureModal from "@/components/ui/BiometricCaptureModal";
import { useXmlDraft } from "@/lib/hooks/useXmlDraft";

export function CitizenForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [manualPhoto, setManualPhoto] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [showFullForm, setShowFullForm] = useState(false);
  const [initialCitizenId, setInitialCitizenId] = useState("");
  const [initialImageBase64, setInitialImageBase64] = useState<string>("");
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [passportDetailData, setPassportDetailData] = useState<any>(null);
  const [nadraDetailData, setNadraDetailData] = useState<any>(null);
  const [isPassportDataFetched, setIsPassportDataFetched] =
    useState<boolean>(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentXmlFileIndex, setCurrentXmlFileIndex] = useState(0);
  const [biometricData, setBiometricData] = useState<any>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [capturedFingerprint, setCapturedFingerprint] = useState<{
    imageBase64: string;
    templateBase64?: string;
    imageDpi?: number;
    imageQuality?: number;
    wsqBase64?: string;
    wsqSize?: number;
    deviceModel?: string;
    serial?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const { fileCount, files, isLoading: isXmlLoading, error: xmlError, currentFileName, loadFile, refreshFileList, moveCurrentFile } = useXmlDraft();

  // Function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to handle manual image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification.error("Please select a valid image file");
      // Reset file input
      event.target.value = "";
      return;
    }

    // Validate file size (max 10MB for initial upload)
    if (file.size > 10 * 1024 * 1024) {
      showNotification.error("Image size must be less than 10MB");
      // Reset file input
      event.target.value = "";
      return;
    }

    // Open image editor
    setSelectedFile(file);
    setShowImageEditor(true);
  };

  // Function to handle image save from editor
  const handleImageSave = (base64: string) => {
    setImageBase64(base64);
    form.setValue("image", base64);
    setManualPhoto(`data:image/jpeg;base64,${base64}`);
    setSelectedFile(null);
    setShowImageEditor(false);
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showNotification.success("Image processed and saved successfully");
  };

  // Function to handle image editor close without saving
  const handleImageEditorClose = () => {
    // Clear the selected file and close the editor
    setSelectedFile(null);
    setShowImageEditor(false);
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Don't clear existing image data - only clear if user was trying to upload a new one
  };

  // Function to handle biometric capture
  const handleBiometricCapture = (data: {
    imageBase64: string;
    templateBase64?: string;
    imageDpi?: number;
    imageQuality?: number;
    wsqBase64?: string;
    wsqSize?: number;
    deviceModel?: string;
    serial?: string;
  }) => {
    setCapturedFingerprint(data);
    setShowBiometricModal(false);
    showNotification.success("Fingerprint captured successfully");
  };

  // Function to clear captured fingerprint
  const handleClearFingerprint = () => {
    setCapturedFingerprint(null);
    showNotification.info("Fingerprint data cleared");
  };

  const form = useForm<CitizenFormData>({
    resolver: zodResolver(citizenSchema),
    defaultValues: {
      citizen_id: initialCitizenId,
      first_name: "",
      last_name: "",
      image: "",
      father_name: "",
      mother_name: "",
      gender: "",
      date_of_birth: "",
      profession: "",
      pakistan_address: "",
      birth_country: "",
      birth_city: "",
      height: "",
      color_of_eyes: "",
      color_of_hair: "",
      transport_mode: "",
      investor: "",
      requested_by: "",
      reason_for_deport: "",
      securityDeposit: "",
      amount: 0,
      currency: "",
      is_fia_blacklist: false,
      status: "DRAFT",
      passport_api_data: undefined,
      nadra_api_data: undefined,
      passport_response_id: "",
    },
  });

  // Function to map passport API response to form data
  const mapPassportDataToForm = (
    passportData: PassportApiResponse
  ): Partial<CitizenFormData> => {
    // Helper function to format date from DD-MMM-YYYY to YYYY-MM-DD
    const formatDate = (dateStr: string): string => {
      try {
        const months: { [key: string]: string } = {
          JAN: "01",
          FEB: "02",
          MAR: "03",
          APR: "04",
          MAY: "05",
          JUN: "06",
          JUL: "07",
          AUG: "08",
          SEP: "09",
          OCT: "10",
          NOV: "11",
          DEC: "12",
        };

        const [day, month, year] = dateStr.split("-");
        const monthNum = months[month] || "01";
        return `${year}-${monthNum}-${day.padStart(2, "0")}`;
      } catch {
        return dateStr;
      }
    };

    return {
      citizen_id: passportData.citizen_no,
      first_name: passportData.first_names || "",
      last_name: passportData.last_name || "",
      image: passportData.photograph || "",
      father_name: passportData.father_first_names  + passportData.father_last_name|| "",
      gender:
        passportData.gender === "m"
          ? "Male"
          : passportData.gender === "f"
          ? "Female"
          : passportData.gender,
      date_of_birth: formatDate(passportData.birthdate),
      profession: passportData.profession,
      birth_country:
        passportData.birthcountry === "PK"
          ? "Pakistan"
          : passportData.birthcountry,
      birth_city: passportData.birthcity,
      pakistan_address: passportData.pakistan_address,
    };
  };

  // Handler for immediate navigation from photo card
  const handlePhotoCardNavigate = (
    citizenId: string,
    imageBase64: string | null
  ) => {
    console.log("handlePhotoCardNavigate called with:", {
      citizenId,
      hasImage: !!imageBase64,
    });

    if (!/^\d{13}$/.test(citizenId)) {
      showNotification.error("Please enter a valid 13-digit citizen ID");
      return;
    }

    // Set initial values from photo card
    setInitialCitizenId(citizenId);
    setInitialImageBase64(imageBase64 || "");

    // Set form values
    form.setValue("citizen_id", citizenId);
    form.setValue("image", imageBase64 || "");

    // Set photo for display if available
    if (imageBase64) {
      setManualPhoto(`data:image/jpeg;base64,${imageBase64}`);
      setImageBase64(imageBase64);
    }

    // Immediately show the full form
    setShowFullForm(true);

    // Start fetching data in the background
    handlePhotoCardGetData(citizenId, imageBase64);
  };

  // Handler for photo card "Get Data" button (background API calls)
  const handlePhotoCardGetData = async (
    citizenId: string,
    imageBase64: string | null
  ) => {
    console.log("handlePhotoCardGetData called with:", {
      citizenId,
      hasImage: !!imageBase64,
    });

    if (!/^\d{13}$/.test(citizenId)) {
      showNotification.error("Please enter a valid 13-digit citizen ID");
      return;
    }

    // Note: Form values are already set by handlePhotoCardNavigate

    setIsFetchingData(true);
    try {
      // Try passport API first
      const passportData = await passportAPI.getCitizenData(citizenId);
      const mappedData = mapPassportDataToForm(passportData);

      // Update form with mapped data (skip empty values)
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          form.setValue(key as keyof CitizenFormData, value, { shouldDirty: true, shouldValidate: true });
        }
      });

      // Set passport photo if available (override uploaded photo)
      if (passportData.photograph) {
        setPassportPhoto(`data:image/jpeg;base64,${passportData.photograph}`);
        setImageBase64(passportData.photograph);
        form.setValue("image", passportData.photograph);
      }

      // Store passport API data for submission
      form.setValue("passport_api_data", passportData);

      // Set passport detail data for display
      setPassportDetailData({
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        father_name: mappedData.father_name,
        gender: mappedData.gender,
        date_of_birth: mappedData.date_of_birth,
        birth_country: mappedData.birth_country,
        birth_city: mappedData.birth_city,
        profession: mappedData.profession,
        pakistan_address: mappedData.pakistan_address,
      });

      // Mark passport data as fetched
      setIsPassportDataFetched(true);

      // Clear NADRA detail data
      setNadraDetailData(null);

      // Store passport API data for later use in application creation
      form.setValue("passport_api_data", passportData);

      // showNotification.success("Data fetched successfully from Passport API");
    } finally {
      setIsFetchingData(false);
      // Don't show full form here - it's already shown by navigation
    }
  };
  const handleBackBtn = () => {
    // Clear form values
    form.reset({
      citizen_id: "",
      first_name: "",
      last_name: "",
      image: "",
      father_name: "",
      mother_name: "",
      gender: "",
      date_of_birth: "",
      profession: "",
      pakistan_address: "",
      birth_country: "",
      birth_city: "",
      height: "",
      color_of_eyes: "",
      color_of_hair: "",
      transport_mode: "",
      investor: "",
      requested_by: "",
      reason_for_deport: "",
      securityDeposit: "",
      amount: 0,
      currency: "",
      is_fia_blacklist: false,
      status: "DRAFT",
      passport_api_data: undefined,
      nadra_api_data: undefined,
      passport_response_id: "",
    });

    // Clear image states
    setPassportPhoto(null);
    setImageBase64("");
    setInitialCitizenId("");
    setInitialImageBase64("");
    setManualPhoto(null);
    // Clear detail data states
    setPassportDetailData(null);
    setNadraDetailData(null);
    setIsPassportDataFetched(false);
    // Clear biometric data
    setCapturedFingerprint(null);
    setBiometricData(null);

    // Reset to photo card view
    setShowFullForm(false);
  };

  // Function to handle loading XML draft files
  const handleLoadXmlFile = async () => {
    if (files.length === 0) {
      showNotification.error("No XML files found in draft folder");
      return;
    }

    if (currentXmlFileIndex >= files.length) {
      showNotification.info("All XML files have been processed");
      return;
    }

    const fileName = files[currentXmlFileIndex];
    const xmlData = await loadFile(fileName);

    if (xmlData) {
      // Populate all form fields with XML data
      form.setValue("citizen_id", xmlData.citizenId);
      form.setValue("first_name", xmlData.firstName);
      form.setValue("last_name", xmlData.lastName);
      form.setValue("image", xmlData.imageBase64);
      form.setValue("father_name", xmlData.fatherName);
      form.setValue("mother_name", xmlData.motherName);
      form.setValue("gender", xmlData.gender, { shouldDirty: true, shouldValidate: true });
      form.setValue("date_of_birth", xmlData.dateOfBirth);
      form.setValue("profession", xmlData.profession);
      form.setValue("pakistan_address", xmlData.pakistanAddress);
      form.setValue("birth_country", xmlData.birthCountry);
      form.setValue("birth_city", xmlData.birthCity);
      form.setValue("requested_by", xmlData.requestedBy);
      
      // Optional fields
      if (xmlData.height) form.setValue("height", xmlData.height);
      if (xmlData.colorOfEyes) form.setValue("color_of_eyes", xmlData.colorOfEyes);
      if (xmlData.colorOfHair) form.setValue("color_of_hair", xmlData.colorOfHair);
      if (xmlData.transportMode) form.setValue("transport_mode", xmlData.transportMode);
      if (xmlData.reasonForDeport) form.setValue("reason_for_deport", xmlData.reasonForDeport);
      if (xmlData.amount) form.setValue("amount", parseFloat(xmlData.amount) || 0);
      if (xmlData.currency) form.setValue("currency", xmlData.currency);
      if (xmlData.investor) form.setValue("investor", xmlData.investor);
      if (xmlData.securityDeposit) form.setValue("securityDeposit", xmlData.securityDeposit);
      
      // Set image states
      setImageBase64(xmlData.imageBase64);
      setInitialCitizenId(xmlData.citizenId);
      setInitialImageBase64(xmlData.imageBase64);
      setManualPhoto(`data:image/jpeg;base64,${xmlData.imageBase64}`);
      
      // Store biometric data if available
      if (xmlData.fingerprint || xmlData.fingerprintTemplate || xmlData.biometricImage) {
        setBiometricData({
          fingerprint: xmlData.fingerprint,
          fingerprintTemplate: xmlData.fingerprintTemplate,
          biometricImage: xmlData.biometricImage
        });
        
        // Also set captured fingerprint data for display
        if (xmlData.fingerprint) {
          setCapturedFingerprint({
            imageBase64: xmlData.fingerprint,
            templateBase64: xmlData.fingerprintTemplate,
            wsqBase64: xmlData.biometricImage,
            deviceModel: 'XML Import',
            serial: 'XML-Import'
          });
        }
        
        console.log("Biometric data loaded from XML:", {
          hasFingerprint: !!xmlData.fingerprint,
          hasTemplate: !!xmlData.fingerprintTemplate,
          hasBiometricImage: !!xmlData.biometricImage
        });
      }
      
      // Move to next file for next time
      setCurrentXmlFileIndex(prev => prev + 1);
      
      // Trigger GetData automatically
      handlePhotoCardNavigate(xmlData.citizenId, xmlData.imageBase64);
      
      showNotification.success(`Loaded file ${currentXmlFileIndex + 1}/${files.length}: ${fileName} - All fields populated`);
    } else {
      showNotification.error(`Failed to load file: ${fileName}`);
    }
  };

  // Function to reset XML file loading
  const handleResetXmlFiles = () => {
    setCurrentXmlFileIndex(0);
    setBiometricData(null);
    showNotification.info("XML file loading reset to beginning");
  };

  const handleGetData = async () => {
    const citizenId = form.getValues("citizen_id");
    if (!/^\d{13}$/.test(citizenId)) {
      showNotification.error("Please enter a valid 13-digit citizen ID");
      return;
    }

    setIsFetchingData(true);
    try {
      // Try passport API first
      const passportData = await passportAPI.getCitizenData(citizenId);
      const mappedData = mapPassportDataToForm(passportData);

      // Update form with mapped data (skip empty values)
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          form.setValue(key as keyof CitizenFormData, value, { shouldDirty: true, shouldValidate: true });
        }
      });

      // Set passport photo if available
      if (passportData.photograph) {
        setPassportPhoto(`data:image/jpeg;base64,${passportData.photograph}`);
        setImageBase64(passportData.photograph);
      }

      // Store passport API data for submission
      form.setValue("passport_api_data", passportData);

      // Set passport detail data for display
      console.log('gender to map -> ', mappedData.gender)
      setPassportDetailData({
        first_name: mappedData.first_name,
        last_name: mappedData.last_name,
        father_name: mappedData.father_name,
        mother_name: "Not available",
        gender: mappedData.gender,
        date_of_birth: mappedData.date_of_birth,
        birth_country: mappedData.birth_country,
        birth_city: mappedData.birth_city,
        profession: mappedData.profession,
        pakistan_address: "Not available",
      });

      // Mark passport data as fetched
      setIsPassportDataFetched(true);

      // Clear NADRA detail data
      setNadraDetailData(null);

      // Store passport API data for later use in application creation
      form.setValue("passport_api_data", passportData);

      // showNotification.success("Data fetched successfully from Passport API");
    } finally {
      setIsFetchingData(false);
    }
  };

  const onSubmit = async (data: CitizenFormData) => {
    console.log("Form submission started with data:", data);
    setIsLoading(true);

    try {
      // Validate required fields
      const requiredFields = [
        { field: "citizen_id", value: data.citizen_id, label: "Citizen ID" },
        { field: "first_name", value: data.first_name, label: "First Name" },
        { field: "last_name", value: data.last_name, label: "Last Name" },
        { field: "image", value: data.image, label: "Image" },
        {
          field: "father_name",
          value: data.father_name,
          label: "Father's Name",
        },
        {
          field: "mother_name",
          value: data.mother_name,
          label: "Mother's Name",
        },
        { field: "gender", value: data.gender, label: "Gender" },
        {
          field: "date_of_birth",
          value: data.date_of_birth,
          label: "Date of Birth",
        },
        { field: "profession", value: data.profession, label: "Profession" },
        {
          field: "pakistan_address",
          value: data.pakistan_address,
          label: "Address",
        },
        {
          field: "birth_country",
          value: data.birth_country,
          label: "Birth Country",
        },
        { field: "birth_city", value: data.birth_city, label: "Birth City" },
        {
          field: "requested_by",
          value: data.requested_by,
          label: "Requested By",
        },
      ];

      const missingFields = requiredFields.filter(
        (field) => !field.value || field.value.trim() === ""
      );

      if (missingFields.length > 0) {
        const missingFieldNames = missingFields
          .map((field) => field.label)
          .join(", ");
        showNotification.error(
          `Please fill in the following required fields: ${missingFieldNames}`
        );
        setIsLoading(false);
        return;
      }

      // Validate that image is provided
      if (!data.image || data.image.trim() === "") {
        showNotification.error("Please upload a photograph before submitting");
        setIsLoading(false);
        return;
      }

      console.log("Image validation passed");

      // Prepare API data objects
      const now = new Date().toISOString();

      // Create passport API data if we have passport information (optional)
      const passportApiData = data.passport_api_data ?? undefined;

      // Create NADRA API data if we have NADRA information (optional)
      const nadraApiData = data.nadra_api_data ?? undefined;

      console.log(
        "Passport API data:",
        passportApiData ? "present" : "not present"
      );
      console.log("NADRA API data:", nadraApiData ? "present" : "not present");

      // Check if passport response was fetched using the boolean state
      const isPassportResponseFetched = isPassportDataFetched;

      // Log user data for debugging
      console.log("User data from auth store:", user);
      console.log("User locationId:", user?.locationId);

      // Format the application data according to the new API structure
      const applicationData = {
        first_name: data.first_name,
        last_name: data.last_name,
        image: data.image,
        father_name: data.father_name,
        mother_name: data.mother_name,
        citizen_id: data.citizen_id,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        birth_country: data.birth_country,
        birth_city: data.birth_city,
        profession: data.profession,
        pakistan_address: data.pakistan_address,
        height: data.height || "",
        color_of_hair: data.color_of_hair || "",
        color_of_eyes: data.color_of_eyes || "",
        transport_mode: data.transport_mode || "",
        investor: data.investor || "",
        requested_by: data.requested_by,
        reason_for_deport: data.reason_for_deport || "",
        amount: data.amount || 0,
        currency: data.currency || "",
        is_fia_blacklist: data.is_fia_blacklist || false,
        status: "DRAFT",
        location_id: user?.locationId || "",
        passport_photo_url: data.image
          ? `data:image/jpeg;base64,${data.image}`
          : undefined,
        other_documents_url: undefined, // Will be set when documents are uploaded
        passport_api_data: passportApiData,
        nadra_api_data: nadraApiData,
        sheet_number: selectedSheet || undefined,
        nadra_response_id: nadraApiData?.id || undefined,
        passport_response_id: data.passport_response_id || undefined,
        isPassportResponseFetched: isPassportResponseFetched,
        // Add biometric data if captured
        fingerprint_image: capturedFingerprint?.imageBase64 || undefined,
        fingerprint_template: capturedFingerprint?.templateBase64 || undefined,
        fingerprint_wsq: capturedFingerprint?.wsqBase64 || undefined,
        fingerprint_quality: capturedFingerprint?.imageQuality || undefined,
        fingerprint_dpi: capturedFingerprint?.imageDpi || undefined,
        fingerprint_device_model: capturedFingerprint?.deviceModel || undefined,
        fingerprint_device_serial: capturedFingerprint?.serial || undefined,
        fingerprint_wsq_size: capturedFingerprint?.wsqSize || undefined,
      };

      console.log("Sending application data to API:", applicationData);
      console.log("API endpoint: /applications");

      const application = await applicationAPI.create(applicationData);
      console.log("API response received:", application);

      // Create passport response with tracking ID and volume tracking ID if passport data exists
      if (passportApiData && application.id) {
        try {
          const mappedData = mapPassportDataToForm(passportApiData);
          const passportResponseData = {
            citizen_id: data.citizen_id,
            tracking_id: application.id,
            volume_tracking_id: application.id,
            image_url: passportApiData.photograph
              ? `data:image/jpeg;base64,${passportApiData.photograph}`
              : "",
            first_name: mappedData.first_name || "",
            last_name: mappedData.last_name || "",
            father_name: mappedData.father_name || "",
            gender: mappedData.gender || "",
            date_of_birth: mappedData.date_of_birth || "",
            birth_country: mappedData.birth_country || "",
            birth_city: mappedData.birth_city || "",
            profession: mappedData.profession || "",
            pakistan_address: mappedData.pakistan_address || "",
            response_status: "SUCCESS",
            api_response_date: new Date().toISOString(),
            raw_response: passportApiData,
          };

          const passportResponse = await passportAPI.storePassportResponse(
            passportResponseData
          );
          console.log(
            "Passport response created with tracking ID and volume tracking ID:",
            application.id
          );
        } catch (passportError) {
          console.error(
            "Failed to create passport response with tracking ID:",
            passportError
          );
          // Don't show error to user as this is a background operation
        }
      }

      showNotification.success("Application created successfully");

      // Move the current XML file to xml_submit folder if it was loaded from XML draft
      if (currentFileName) {
        try {
          const moveSuccess = await moveCurrentFile();
          if (moveSuccess) {
            console.log(`XML file ${currentFileName} moved to xml_submit folder`);
            showNotification.success(`XML file ${currentFileName} moved to submitted folder`);
          } else {
            console.warn(`Failed to move XML file ${currentFileName}`);
            showNotification.warning(`Application created but failed to move XML file`);
          }
        } catch (error) {
          console.error("Error moving XML file:", error);
          showNotification.warning(`Application created but failed to move XML file`);
        }
      }

      // Navigate based on user role
      console.log("Application created successfully, user role:", user?.role);
      if (user?.role === "MISSION_OPERATOR") {
        // Mission Operators go back to their main dashboard
        console.log("Redirecting Mission Operator to dashboard");
        router.push("/mission");
      } else {
        // Other roles can view the application details
        console.log("Redirecting to application details page");
        router.push(`/applications/${application.id}`);
      }
    } catch (error) {
      console.error("Error creating application:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Show the actual error message from the API response
      if (error && typeof error === "object") {
        // Handle axios error response
        if (
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response
        ) {
          const responseData = error.response.data;
          if (
            responseData &&
            typeof responseData === "object" &&
            "message" in responseData
          ) {
            showNotification.error(responseData.message as string);
          } else {
            showNotification.error("Failed to create application");
          }
        }
        // Handle direct error object with message
        else if ("message" in error) {
          showNotification.error(error.message as string);
        } else {
          showNotification.error("Failed to create application");
        }
      } else if (error instanceof Error) {
        showNotification.error(error.message);
      } else {
        showNotification.error("Failed to create application");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 dashboardBackgroundColor">
      <div className="relative z-20 max-w-4xl mx-auto  ">
        {!showFullForm ? (
          
          // Show photo card first
          <div className="mt-40 "><DGIPHeaderWithWatermarks/>

          <ETDApplicationPhotoCard
            title="Emergency Travel Document Application"
            onNavigate={(citizenId, imageBase64) => {
              console.log("Get Data pressed with citizen ID:", citizenId);
              console.log("Current imageBase64:", imageBase64);
              handlePhotoCardNavigate(citizenId, imageBase64);
            }}
            onImageChange={(base64) => {
              console.log("Image changed:", base64 ? "has image" : "no image");
              if (base64) {
                setImageBase64(base64);
                form.setValue("image", base64);
              } else {
                setImageBase64("");
                form.setValue("image", "");
              }
            }}
          
          />
        </div>
        ) : (
          <div >             <DGIPHeaderWithWatermarks/>
          <Card>
            <CardHeader>

              {/* <div className="flex items-center justify-between"> */}
              <div>
                <CardTitle className="text-2xl font-bold">
                  Emergency Travel Document Application
                </CardTitle>
                <CardDescription>
                  Enter citizen information to create a new application
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleBackBtn()}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {/* </div> */}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.error("Form validation errors:", errors);

                  // Get the first error message to show to the user
                  const firstError = Object.values(errors)[0];
                  if (firstError && typeof firstError === 'object' && 'message' in firstError) {
                    showNotification.error(firstError.message as string);
                  } else {
                    showNotification.error(
                      "Please fill all the required fields before submitting"
                    );
                  }
                })}
                className="space-y-6"
              >
                {/* Citizen ID Section */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="citizen_id">Citizen ID</Label>
                    <Input
                      id="citizen_id"
                      placeholder="Enter 13-digit citizen ID"
                      maxLength={13}
                      pattern="\d{13}"
                      inputMode="numeric"
                      {...form.register("citizen_id")}
                      className={`rounded-xl ${
                        form.formState.errors.citizen_id ? "border-red-500" : ""
                      }`}
                    />
                    {form.formState.errors.citizen_id && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.citizen_id.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleGetData}
                    disabled={
                      isFetchingData ||
                      !/^\d{13}$/.test(form.watch("citizen_id"))
                    }
                    className="mt-6"
                  >
                    {isFetchingData ? "Fetching..." : "Get Data"}
                  </Button>
                </div>
                <div className="mx-auto p-2 space-y-2">
                  <div className="flex items-center gap-3">
                    {/* Passport Details - Shows data when passport API is successful */}
                    <DetailForm
                      data={passportDetailData}
                      title="Passport Details"
                      passportPhoto={passportPhoto}
                      onNext={() => {}}
                      onBack={() => {}}
                    />

                    {/* NADRA Details - Always shows "Not available" for now */}
                    <DetailForm
                      data={{}}
                      title="NADRA Details"
                      passportPhoto={null}
                      onNext={() => {}}
                      onBack={() => {}}
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-lg font-semibold mb-4 block">
                    Photograph *
                  </Label>

                  {/* Image Display */}
                  {manualPhoto && (
                    <div className="flex justify-center mb-4">
                      <div className=" bg-white">
                        <Image
                          src={manualPhoto || ""}
                          alt="Citizen Photo"
                          width={128}
                          height={160}
                          className="object-cover rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                                                 <input
                           ref={fileInputRef}
                           type="file"
                           accept="image/*"
                           onChange={handleImageUpload}
                           className="block w-full text-sm text-gray-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700
                             hover:file:bg-blue-100"
                         />
                      </div>
                    </div>

                    {!manualPhoto && !imageBase64 && (
                      <p className="text-sm text-gray-600">
                        No image available from passport API. Please upload a
                        photo manually.
                      </p>
                    )}

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Image Requirements:</strong> 540×420 pixels, maximum 18KB, JPEG format
                      </p>
                    </div>

                    {form.formState.errors.image && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.image.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fingerprint Capture Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-lg font-semibold mb-4 block">
                    Fingerprint Capture
                  </Label>

                  {/* Fingerprint Display */}
                  {capturedFingerprint && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-2 rounded border">
                        <img
                          src={`data:image/bmp;base64,${capturedFingerprint.imageBase64}`}
                          alt="Captured Fingerprint"
                          width={128}
                          height={160}
                          className="object-contain rounded"
                        />
                        {/* <div className="text-xs text-gray-600 mt-2 text-center">
                          <p>Device: {capturedFingerprint.deviceModel || 'Unknown'}</p>
                          <p>Serial: {capturedFingerprint.serial || 'N/A'}</p>
                          <p>Quality: {capturedFingerprint.imageQuality || 'N/A'}</p>
                          {capturedFingerprint.wsqBase64 && (
                            <p>WSQ Size: {capturedFingerprint.wsqSize || 'N/A'} bytes</p>
                          )}
                        </div> */}
                      </div>
                    </div>
                  )}

                  {/* Fingerprint Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        onClick={() => setShowBiometricModal(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {capturedFingerprint ? "Recapture Fingerprint" : "Capture Fingerprint"}
                      </Button>
                      
                      {capturedFingerprint && (
                        <Button
                          type="button"
                          onClick={handleClearFingerprint}
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear Fingerprint
                        </Button>
                      )}
                    </div>

                    {!capturedFingerprint && (
                      <p className="text-sm text-gray-600">
                        No fingerprint captured. Click "Capture Fingerprint" to add biometric data.
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="font-bold">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      {...form.register("first_name")}
                      className={
                        form.formState.errors.first_name ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.first_name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="font-bold">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      {...form.register("last_name")}
                      className={
                        form.formState.errors.last_name ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.last_name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="father_name" className="font-bold">
                      Father&apos;s Name *
                    </Label>
                    <Input
                      id="father_name"
                      {...form.register("father_name")}
                      className={
                        form.formState.errors.father_name
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {form.formState.errors.father_name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.father_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="mother_name" className="font-bold">
                      Mother&apos;s Name *
                    </Label>
                    <Input
                      id="mother_name"
                      {...form.register("mother_name")}
                      className={
                        form.formState.errors.mother_name
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {form.formState.errors.mother_name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.mother_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender" className="font-bold">
                      Gender *
                    </Label>
                    {/* <Input 
                     id="gender" 
                     {...form.register("gender")} 
                     className={form.formState.errors.gender ? "border-red-500" : ""}
                   />
                   {form.formState.errors.gender && (
                     <p className="text-sm text-red-500 mt-1">{form.formState.errors.gender.message}</p>
                   )} */}
                    <div className="relative">
                      <select
                        id="gender"
                        {...form.register("gender")}
                        className={`text-sm bg-white appearance-none w-full px-3 py-2 rounded-xl text-gray-500 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          form.formState.errors.gender
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>

                      {form.formState.errors.gender && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.gender.message}
                        </p>
                      )}
                      <ChevronDown className="absolute right-2 top-3 text-gray-500 h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth" className="font-bold">
                      Date of Birth *
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      {...form.register("date_of_birth")}
                      className={`text-gray-500 ${
                        form.formState.errors.date_of_birth
                          ? "border-red-500"
                          : ""
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
                    <Label htmlFor="birth_country" className="font-bold">
                      Birth Country *
                    </Label>
                    <Input
                      id="birth_country"
                      {...form.register("birth_country")}
                      className={
                        form.formState.errors.birth_country
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {form.formState.errors.birth_country && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.birth_country.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="birth_city" className="font-bold">
                      Birth City *
                    </Label>
                    <Input
                      id="birth_city"
                      {...form.register("birth_city")}
                      className={
                        form.formState.errors.birth_city ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.birth_city && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.birth_city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="profession" className="font-bold">
                      Profession *
                    </Label>
                    <Input
                      id="profession"
                      {...form.register("profession")}
                      className={
                        form.formState.errors.profession ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.profession && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.profession.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pakistan_address" className="font-bold">
                      Address *
                    </Label>
                    <Input
                      id="pakistan_address"
                      {...form.register("pakistan_address")}
                      className={
                        form.formState.errors.pakistan_address
                          ? "border-red-500"
                          : ""
                      }
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
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      placeholder="e.g., 5.9"
                      {...form.register("height")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color_of_eyes">Eye Color</Label>
                    <Input
                      id="color_of_eyes"
                      {...form.register("color_of_eyes")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color_of_hair">Hair Color</Label>
                    <Input
                      id="color_of_hair"
                      {...form.register("color_of_hair")}
                    />
                  </div>
                </div>

                {/* Travel & Request Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transport_mode">Transport Mode</Label>
                    <Input
                      id="transport_mode"
                      placeholder="e.g., Air, Road, Sea"
                      {...form.register("transport_mode")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="investor">Investor</Label>
                    <Input
                      id="investor"
                      placeholder="Gov of Pakistan"
                      {...form.register("investor")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="requested_by" className="font-bold">
                      Requested By *
                    </Label>
                    <Input
                      id="requested_by"
                      {...form.register("requested_by")}
                      className={
                        form.formState.errors.requested_by
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {form.formState.errors.requested_by && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.requested_by.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="reason_for_deport">Reason for Deport</Label>
                    <Input
                      id="reason_for_deport"
                      {...form.register("reason_for_deport")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="securityDeposit">
                      Security Deposit Description (if any)
                    </Label>
                    <Input
                      id="securityDeposit"
                      placeholder="-"
                      {...form.register("securityDeposit")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...form.register("amount", { valueAsNumber: true })}
                      className={
                        form.formState.errors.amount ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...form.register("currency")} />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>

        )}
      </div>

      {/* Image Editor Modal */}
      <ImageEditorModal
        isOpen={showImageEditor}
        onClose={handleImageEditorClose}
        onSave={handleImageSave}
        file={selectedFile}
      />

      {/* Biometric Capture Modal */}
      <BiometricCaptureModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onCaptured={handleBiometricCapture}
        endpoint="https://localhost:8443/SGIFPCapture"
      />
    </div>
  );
}
