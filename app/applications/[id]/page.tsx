"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Application, Region, UserRole } from "@/lib/types";
import { applicationAPI } from "@/lib/api/applications";
import { attachmentAPI } from "@/lib/api/attachments";
import { passportAPI } from "@/lib/api/passport";
import {
  formatDate,
  formatDateTime,
  formatStatus,
  getStatusVariant,
} from "@/lib/utils/formatting";
import { showNotification } from "@/lib/utils/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Printer,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  FileText,
  Eye,
  Download,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { SendForVerificationModal } from "@/components/ministry/SendForVerificationModal";
import { SubmitVerificationModal } from "@/components/agency/SubmitVerificationModal";
import { MinistryReviewModal } from "@/components/ministry/MinistryReviewModal";
import { DraftReviewModal } from "@/components/ministry/DraftReviewModal";
import { PDFLink } from "@/components/ui/PDFViewer";

import DGIPHeader from "@/components/ui/dgip_header";
import DGIPWatermarks from "@/components/ui/dgip_watermark";
import QCModal from "@/components/dashboard/QCModal";

export default function ApplicationViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [showSendForVerificationModal, setShowSendForVerificationModal] =
    useState(false);
  const [showSubmitVerificationModal, setShowSubmitVerificationModal] =
    useState(false);
  const [showMinistryReviewModal, setShowMinistryReviewModal] = useState(false);
  const [showDraftReviewModal, setShowDraftReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [passportResponseData, setPassportResponseData] = useState<any>(null);
  const [isPassportLoading, setIsPassportLoading] = useState(false);
  const role: UserRole | undefined = user?.role as UserRole | undefined;
  console.log("User role:", role);
  console.log("User object:", user);
  console.log("Application status:", application?.status);
  console.log('Role === "MINISTRY":', role === "MINISTRY");
  console.log('Status === "DRAFT":', application?.status === "DRAFT");
  const canPerformAction = useMemo(() => {
    if (!application) return false;
    const status = application.status;
    console.log("Checking canPerformAction for role:", role, "status:", status);
    switch (role) {
      case "MISSION_OPERATOR":
        return status === "DRAFT";
      case "AGENCY":
        return ["SUBMITTED", "AGENCY_REVIEW", "PENDING_VERIFICATION"].includes(
          status
        );
      case "MINISTRY":
        const ministryAllowed = [
          "DRAFT",
          "SUBMITTED",
          "MINISTRY_REVIEW",
          "AGENCY_REVIEW",
          "VERIFICATION_SUBMITTED",
          "VERIFICATION_RECEIVED",
        ].includes(status);
        console.log("Ministry allowed statuses check:", ministryAllowed);
        return ministryAllowed;
      case "ADMIN":
        return true;
      default:
        console.log("No matching role case, returning false");
        return false;
    }
  }, [application, role]);

  console.log("Can perform action:", canPerformAction);

  const canPrint = useMemo(() => {
    if (!application) return false;
    const allowedStatuses = ["READY_FOR_PRINT"];
    return (
      (role === "MISSION_OPERATOR") &&
      allowedStatuses.includes(application.status)
    );
  }, [application, role]);

  const canPerformQC = useMemo(() => {
    if (!application) return false;
    const allowedStatuses = ["READY_FOR_QC"];
    return (
      (role === "MISSION_OPERATOR") &&
      allowedStatuses.includes(application.status)
    );
  }, [application, role]);

  const refresh = async () => {
    if (!params?.id) return;
    setIsLoading(true);
    try {
      const data = await applicationAPI.getById(params.id as string);
      setApplication(data);
    } catch {
      showNotification.error("Failed to fetch application details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassportResponse = async (volumeTrackingId: string) => {
    if (!volumeTrackingId) return;
    setIsPassportLoading(true);
    try {
      const response = await passportAPI.getPassportResponseByVolumeTracking(volumeTrackingId);
      if (response) {
        setPassportResponseData(response);
      }
    } catch (error) {
      console.error('Error fetching passport response:', error);
    } finally {
      setIsPassportLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  useEffect(() => {
    if (application?.id) {
      fetchPassportResponse(application.id);
    }
  }, [application?.id]);



  // New Ministry Review handlers
  const handleMinistryReviewApprove = async (data: {
    approved: boolean;
    blacklist_check_pass: boolean;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      // For applications with agency remarks (VERIFICATION_RECEIVED status), use updateStatus
      if (application.status === "VERIFICATION_RECEIVED") {
        await applicationAPI.updateStatus(application.id, {
          status: "READY_FOR_PERSONALIZATION",
          blacklist_check_pass: data.blacklist_check_pass || false,
          ...(data.etd_issue_date && { etd_issue_date: data.etd_issue_date }),
          ...(data.etd_expiry_date && {
            etd_expiry_date: data.etd_expiry_date,
          }),
        });
      } else {
        // For other statuses, use ministryReview
        await applicationAPI.ministryReview(application.id, {
          approved: true,
          blacklist_check_pass: data.blacklist_check_pass,
          etd_issue_date: data.etd_issue_date,
          etd_expiry_date: data.etd_expiry_date,
        });
      }
      showNotification.success("Application approved successfully");
      await refresh();
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        "Failed to approve application";
      showNotification.error(message);
      throw error; // Re-throw to handle in modal
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMinistryReviewReject = async (data: {
    approved: boolean;
    blacklist_check_pass: boolean;
    rejection_reason: string;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      // For DRAFT status, use updateStatus to reject
      if (application.status === "DRAFT") {
        await applicationAPI.updateStatus(application.id, {
          status: "REJECTED",
          rejection_reason: data.rejection_reason,
          blacklist_check_pass: false,
        });
      }
      // For applications with agency remarks (VERIFICATION_RECEIVED status), use updateStatus
      else if (application.status === "VERIFICATION_RECEIVED") {
        await applicationAPI.updateStatus(application.id, {
          status: "REJECTED",
          rejection_reason: data.rejection_reason,
          blacklist_check_pass: false,
        });
      } else {
        // For other statuses, use ministryReview
        await applicationAPI.ministryReview(application.id, {
          approved: false,
          blacklist_check_pass: false,
          rejection_reason: data.rejection_reason,
          etd_issue_date: undefined,
          etd_expiry_date: undefined,
        });
      }
      showNotification.success("Application rejected");
      // Navigate back instead of refreshing
      router.back();
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        "Failed to reject application";
      showNotification.error(message);
      throw error; // Re-throw to handle in modal
    } finally {
    }
  };
  const handleQcClick = (application: Application) => {
    setSelectedApplication(application);
    setQcModalOpen(true);
  };

  const handleQcSuccess = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading applications...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDraftApprove = async (data: {
    blacklist_check_pass?: boolean;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      await applicationAPI.updateStatus(application.id, {
        status: "READY_FOR_PERSONALIZATION",
        blacklist_check_pass: data.blacklist_check_pass,
        ...(data.etd_issue_date && { etd_issue_date: data.etd_issue_date }),
        ...(data.etd_expiry_date && { etd_expiry_date: data.etd_expiry_date }),
      });
      showNotification.success("Application approved");
      setShowDraftReviewModal(false);
      await refresh();
    } catch (error: any) {
      console.error("Failed to approve application:", error);
      showNotification.error(
        error.response?.data?.message || "Failed to approve application"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDraftReject = async (data: {
    rejection_reason: string;
    blacklist_check_pass?: boolean;
    etd_issue_date?: string;
    etd_expiry_date?: string;
  }) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      await applicationAPI.updateStatus(application.id, {
        status: "REJECTED",
        rejection_reason: data.rejection_reason,
        blacklist_check_pass: false,
      });
      showNotification.success("Application rejected");
      setShowDraftReviewModal(false);
      // Navigate back instead of refreshing
      router.back();
    } catch (error: any) {
      console.error("Failed to reject application:", error);
      showNotification.error(
        error.response?.data?.message || "Failed to reject application"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // const handleMinistryApprove = async (data: {
  //   black_list_check?: boolean;
  //   etd_issue_date?: string;
  //   etd_expiry_date?: string;
  // }) => {
  //   if (!application) return;
  //   setIsActionLoading(true);
  //   try {
  //     // Use status update API for all approvals
  //     await applicationAPI.ministryReview(application.id, {
  //       approved: true,
  //       black_list_check: data.black_list_check || false,
  //       etd_issue_date: data.etd_issue_date || "",
  //       etd_expiry_date: data.etd_expiry_date || "",
  //     });
  //     showNotification.success("Application approved");
  //     await refresh();
  //   } catch (error: any) {
  //     console.error("Failed to approve application:", error);
  //     showNotification.error(
  //       error.response?.data?.message || "Failed to approve application"
  //     );
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };
  // const handleMinistryReject = async () => {
  //   if (!application) return;
  //   const rejectionReason = window.prompt("Enter rejection reason:");
  //   if (!rejectionReason) return;
  //   setIsActionLoading(true);
  //   try {
  //     // Use new status update API for VERIFICATION_RECEIVED status
  //     if (application.status === "VERIFICATION_RECEIVED") {
  //       await applicationAPI.ministryReview(application.id, {
  //         approved: false,
  //         black_list_check: true,
  //         rejection_reason: rejectionReason,
  //       });
  //     } else {
  //       // Use legacy API for other statuses
  //       await applicationAPI.ministryReview(application.id, {
  //         approved: false,
  //         black_list_check: true,
  //         rejection_reason: rejectionReason,
  //       });
  //     }
  //     showNotification.success("Application rejected");
  //     await refresh();
  //   } catch {
  //     showNotification.error("Failed to reject application");
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };

  // const handleBlacklist = async () => {
  //   if (!application) return
  //   const remarks = window.prompt("Enter blacklist reason:")
  //   if (!remarks) return
  //   setIsActionLoading(true)
  //   try {
  //     await applicationAPI.ministryReview(application.id, {
  //       approved: false,
  //       black_list_check: true,
  //       rejection_reason: remarks
  //     })
  //     showNotification.success("Application blacklisted")
  //     await refresh()
  //   } catch {
  //     showNotification.error("Failed to blacklist application")
  //   } finally {
  //     setIsActionLoading(false)
  //   }
  // }

  const handleSendToAgency = async () => {
    if (!application) return;
    const region = window.prompt(
      "Select region (PUNJAB, SINDH, KPK, BALOCHISTAN, GILGIT_BALTISTAN, AJK):"
    ) as Region;
    if (!region) return;
    setIsActionLoading(true);
    try {
      await applicationAPI.sendToAgency(application.id, region);
      showNotification.success("Application sent to agency");
      await refresh();
    } catch {
      showNotification.error("Failed to send to agency");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePrintApplication = async () => {
    if (!application) return;

    try {
      setIsActionLoading(true);
      const blob = await applicationAPI.printApplication(application.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `application-${application.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification.success("Application downloaded successfully");
    } catch (error) {
      showNotification.error("Failed to download application");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNavigateToPrint = () => {
    if (!application) return;
    // Open print page in a new tab
    window.open(`/applications/${application.id}/print`, "_blank");
  };

  const handleSendForVerification = async (data: {
    agencies: string[];
    remarks: string;
  }) => {
    if (!application) return;

    console.log("Application page - Received verification data:", {
      agencies: data.agencies,
      agenciesType: typeof data.agencies,
      agenciesLength: data.agencies.length,
      agenciesDetails: data.agencies.map((agency, index) => ({
        index,
        agency,
        type: typeof agency,
        length: agency.length,
      })),
    });

    try {
      setIsActionLoading(true);
      await applicationAPI.sendForVerification(application.id, data);
      showNotification.success("Application sent for verification");
      setShowSendForVerificationModal(false);
      await refresh();
    } catch (error: any) {
      showNotification.error(
        error.response?.data?.message || "Failed to send for verification"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitVerification = async (data: {
    remarks: string;
    attachment?: File;
  }) => {
    if (!application) return;

    try {
      setIsActionLoading(true);
      await applicationAPI.submitVerification(application.id, data);
      showNotification.success("Verification submitted successfully");
      setShowSubmitVerificationModal(false);
      await refresh();
    } catch (error: any) {
      showNotification.error(
        error.response?.data?.message || "Failed to submit verification"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // const handleDirectReject = async () => {
  //   if (!application) return;
  //   const remarks = window.prompt("Enter rejection remarks:");
  //   if (!remarks) return;

  //   try {
  //     setIsActionLoading(true);
  //     await applicationAPI.updateStatus(application.id, {
  //       status: "REJECTED",
  //       rejection_reason: remarks,
  //     });
  //     showNotification.success("Application rejected");
  //     await refresh();
  //   } catch (error: any) {
  //     showNotification.error(
  //       error.response?.data?.message || "Failed to reject application"
  //     );
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Application not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative dashboardBackgroundColor ">
      {/* <DGIPWatermarks  /> */}
      <div className="pt-12 ">
        <DGIPHeader />
      </div>

      <div className="max-w-6xl mx-auto p-6 pt-0 space-y-6 relative z-10">
        {/* <DGIPHeader /> */}
        <Card className="rounded-3xl">
          <div className="flex justify-between gap-2 p-6">
            <CardHeader>
              <CardTitle>Application #{application.id}</CardTitle>
            </CardHeader>
            <div className="flex items-center justify-end gap-4">
              {/* <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button> */}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-4">
                <Badge variant={getStatusVariant(application.status)}>
                  {formatStatus(application.status)}
                </Badge>
                {canPerformQC && (
                  <Button onClick={() => handleQcClick(application)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Quality Control
                  </Button>
                )}
                {canPrint && (
                  <Button
                    onClick={() =>
                      router.push(`/applications/${application.id}/print`)
                    }
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                )}
                {/* Debug button for role testing
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('=== DEBUG USER ROLE INFO ===')
                console.log('Current user:', user)
                console.log('Current role:', role)
                console.log('User role type:', typeof role)
                console.log('User object keys:', Object.keys(user || {}))
                console.log('User state:', user?.state)
                console.log('User agency:', user?.agency)
                console.log('Application status:', application?.status)
                console.log('Can perform action:', canPerformAction)
                console.log('================================')

                const debugInfo = `
🔍 DEBUG USER ROLE INFORMATION:

👤 Current User: ${JSON.stringify(user, null, 2)}

🎭 Current Role: ${role} (${typeof role})

📍 User State: ${user?.state || 'Not set'}
🏢 User Agency: ${user?.agency || 'Not set'}

📋 Application Status: ${application?.status || 'Not loaded'}

✅ Can Perform Action: ${canPerformAction}

🔧 Role Checks:
- Role === "MINISTRY": ${role === "MINISTRY"}
- Role === "AGENCY": ${role === "AGENCY"}
- Role === "ADMIN": ${role === "ADMIN"}
- Role === "MISSION_OPERATOR": ${role === "MISSION_OPERATOR"}

📱 User Object Structure:
${Object.keys(user || {}).map(key => `- ${key}: ${typeof (user as any)?.[key]}`).join('\n')}
                `.trim()

                alert(debugInfo)
              }}
            >
              Debug Role
            </Button> */}
              </div>
            </div>
          </div>

          <CardContent>
            {/* Header Section with Photos and Data Sources */}
            <div className="mb-8">
              <div className="flex gap-2">
                {/* Photos Section - Dynamic width based on available images */}
                {(application.image) && (
                                      <div
                      className={`${
                        application.image
                          ? "lg:w-[40%]"
                          : "lg:w-[40%]"
                      }`}
                    >
                    <div className="bg-white rounded-lg shadow-sm  p-4 h-full w-[80%]">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Citizen Photograph
                      </h3>
                      <div className="flex items-center justify-start gap-4">
                        {/* Main Citizen Photo */}
                        {application.image && (
                          <div className="flex flex-col items-start">
                            <div className="border-2 border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                              <img
                                src={`data:image/jpeg;base64,${application.image}`}
                                alt="Citizen Photograph"
                                className="w-32 h-40 object-cover rounded"
                              />
                            </div>
                            <span className="text-sm text-gray-600 mt-2">
                              Uploaded Photo
                            </span>
                          </div>
                        )}
                        {/* Passport Photo */}
                        {(passportResponseData?.image_url) && (
                          <div className="flex flex-col items-start">
                            <div className="border-2 border-green-300 rounded-lg p-3 bg-white shadow-sm">
                              {isPassportLoading ? (
                                <div className="w-32 h-40 bg-green-50 border-2 border-green-300 rounded flex items-center justify-center">
                                  <span className="text-green-600 text-sm text-center">
                                    Loading...
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={passportResponseData?.image_url}
                                  alt="Passport Photograph"
                                  className="w-32 h-40 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              )}
                              <div className="hidden w-32 h-40 bg-green-50 border-2 border-green-300 rounded flex items-center justify-center">
                                <span className="text-green-600 text-sm text-center">
                                  Passport Photo
                                  <br />
                                  Not Available
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-green-600 mt-2">
                              Passport Photo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Sources and Quick Info - Dynamic width */}
                <div
                  className={`${
                    passportResponseData?.image_url
                      ? "lg:w-[650px]"
                      : "lg:w-[119%]"
                  }`}
                >
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-full flex flex-col  ">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      Data Sources & Verification
                    </h3>

                    {/* Data Source Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* NADRA */}
                      <div className="flex items-center justify-between rounded-xl border p-4 bg-red-50/70 border-red-200">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0" />
                          <span className="font-medium text-blue-900 truncate">
                            NADRA Data
                          </span>
                        </div>
                        <Badge
                          variant={
                            application.nadra_api_data ? "default" : "secondary"
                          }
                          className="shrink-0 px-3 py-1 text-xs rounded-full"
                        >
                          {application.nadra_api_data
                            ? "Available"
                            : "Not Available"}
                        </Badge>
                      </div>

                      {/* Passport */}
                      <div
                        className={`flex items-center justify-between rounded-xl border p-4 ${
                          passportResponseData?.image_url || application.isPassportResponseFetched
                            ? "bg-green-50/70 border-green-200"
                            : "bg-red-50/70 border-red-20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-3.5 h-3.5 rounded-full ${
                              passportResponseData?.image_url || application.isPassportResponseFetched
                                ? "bg-green-500"
                                : "bg-red-500"
                            } shrink-0`}
                          />
                          <span
                            className={`font-medium ${
                              passportResponseData?.image_url || application.isPassportResponseFetched
                                ? "text-green-900"
                                : "text-red-900"
                            } truncate`}
                          >
                            Passport Data
                          </span>
                        </div>
                        <Badge
                          variant={
                            passportResponseData?.image_url || application.passport_api_data
                              ? "default"
                              : "secondary"
                          }
                          className="shrink-0 px-3 py-1 text-xs rounded-full"
                        >
                          {isPassportLoading 
                            ? "Loading..." 
                            : passportResponseData?.image_url || application.isPassportResponseFetched
                            ? "Available"
                            : "Not Available"}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr flex-1 ">
                      <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                        <div className="text-xl font-bold text-gray-900 leading-tight">
                          {application.firstName || "-"}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          First Name
                        </div>
                      </div>

                      <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                        <div className="text-xl font-bold text-gray-900 leading-tight">
                          {application.lastName || "-"}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          Last Name
                        </div>
                      </div>

                      <div className="rounded-xl border bg-gray-50 p-4 flex flex-col justify-between">
                        <div className="font-mono text-base font-semibold text-gray-900 leading-tight break-all">
                          {application.citizenId || "-"}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          Citizen ID
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal & Address */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-fr items-stretch ">
              <Section title="Personal Information" className="h-full ">
                <GridItem label="First Name" value={application.firstName} />
                <GridItem label="Last Name" value={application.lastName} />
                <GridItem
                  label="Father's Name"
                  value={application.fatherName}
                />
                <GridItem
                  label="Mother's Name"
                  value={application.motherName}
                />
                <GridItem
                  label="Citizen ID"
                  value={application.citizenId}
                  mono
                />
                <GridItem
                  label="Date of Birth"
                  value={formatDate(application.dateOfBirth)}
                />
                <GridItem
                  label="Birth Country"
                  value={application.birthCountry || "-"}
                />
                <GridItem
                  label="Birth City"
                  value={application.birthCity || "-"}
                />
                <GridItem label="Profession" value={application.profession} />
              </Section>

              <Section
                title="Physical & Address Information"
                className="h-full"
              >
                <GridItem label="Height" value={application.height || "-"} />
                <GridItem
                  label="Eye Color"
                  value={application.colorOfEyes || "-"}
                />
                <GridItem
                  label="Hair Color"
                  value={application.colorOfHair || "-"}
                />
                <GridItem label="City" value={application.pakistanCity} />
                <GridItem label="Address" value={application.pakistanAddress} />
              </Section>
            </div>

            {/* Travel & Request */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 auto-rows-fr items-stretch">
              <Section title="Travel Information" className="h-full">
                <GridItem
                  label="Departure Date"
                  value={formatDate(application.departureDate)}
                />
                <GridItem
                  label="Transport Mode"
                  value={application.transportMode || "-"}
                />
              </Section>

              <Section
                title="Request & Financial Information"
                className="h-full"
              >
                <GridItem
                  label="Investor"
                  value={application.investor || "-"}
                />
                <GridItem
                  label="Requested By"
                  value={application.requestedBy || "-"}
                />
                <GridItem
                  label="Reason for Deport"
                  value={application.reason_for_deport || "-"}
                />
                <GridItem
                  label="Amount"
                  value={application.securityDeposit || "-"}
                />
              </Section>
            </div>

            {/* Status & Security */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 auto-rows-fr items-stretch">
              <Section title="Application Status & Audit" className="h-full">
                <GridItem
                  label="Status"
                  value={formatStatus(application.status)}
                />
                <GridItem
                  label="Created At"
                  value={formatDate(application.createdAt)}
                />
                <GridItem
                  label="Last Updated"
                  value={formatDate(application.updatedAt)}
                />
                {application.createdBy?.fullName && (
                  <GridItem
                    label="Created By"
                    value={`${application.createdBy.fullName}${
                      application.createdBy.state
                        ? ` (${application.createdBy.state})`
                        : ` (${application.createdBy.role})`
                    }`}
                  />
                )}
                {application.reviewedByUser?.fullName && (
                  <GridItem
                    label="Reviewed By"
                    value={`${application.reviewedByUser.fullName} (${application.reviewedByUser.role})`}
                  />
                )}
              </Section>

              {application.reviewedBy && (
                <Section title="Security & Verification" className="h-full">
                  {/* <GridItem
                    label="FIA Blacklist Status"
                    value={
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            application.isFiaBlacklist
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <span>
                          {application.isFiaBlacklist ? "Blacklisted" : "Clear"}
                        </span>
                      </div>
                    }
                  /> */}
                  {application.blacklistCheckPassed !== undefined && (
                    <GridItem
                      label="Blacklist Check"
                      className="grid-col-2"
                      value={
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              application.blacklistCheckPassed
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                          ></div>
                          <span>
                            {!application.blacklistCheckPassed
                              ? "Not BlackListed"
                              : "BlackListed (Still Approved)"}
                          </span>
                        </div>
                      }
                    />
                  )}
                </Section>
              )}
            </div>

            {/* ETD Information - Only show for approved applications */}
            {application.status === "APPROVED" &&
              (application.etdIssueDate ||
                application.etdExpiryDate ||
                application.blacklistCheckPassed !== undefined) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
                    <h3 className="text-xl font-semibold mb-4 text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Emergency Travel Document (ETD) Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.etdIssueDate && (
                        <GridItem
                          label="ETD Issue Date"
                          value={formatDate(application.etdIssueDate)}
                        />
                      )}
                      {application.etdExpiryDate && (
                        <GridItem
                          label="ETD Expiry Date"
                          value={formatDate(application.etdExpiryDate)}
                        />
                      )}
                      {application.blacklistCheckPassed !== undefined && (
                        <GridItem
                          label="Blacklist Check Status"
                          value={
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  application.blacklistCheckPassed
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              ></div>
                              <span>
                                {!application.blacklistCheckPassed
                                  ? "Passed"
                                  : "Failed (Still Approved)"}
                              </span>
                            </div>
                          }
                        />
                      )}
                      {application.reviewedAt && (
                        <GridItem
                          label="Reviewed At"
                          value={formatDateTime(application.reviewedAt)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {application.attachments && application.attachments.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {application.attachments.map((att) => (
                  <li key={att.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{att.fileName}</div>
                      <div className="text-sm text-gray-500">{att.fileType}</div>
                    </div>
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No attachments uploaded</div>
            )}

            {(role === "AGENCY" || role === "ADMIN") && (
              <div>
                <Label htmlFor="file">Upload attachment</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadAttachment(file)
                    }}
                    disabled={isActionLoading}
                  />
                  <Button type="button" variant="secondary" disabled>
                    <Upload className="mr-2 h-4 w-4" /> Select File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}

        {/* Verification Document - For Agency Users */}
        {role === "AGENCY" && application.status === "PENDING_VERIFICATION" && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Verification Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ministry Verification Document */}
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      {/* <h4 className="font-medium text-blue-900">Ministry Verification Document</h4> */}
                      {/* <p className="text-sm text-blue-700">Official document issued by the Ministry</p> */}
                      <div className="bg-white border-l-4 border-blue-400 p-3 rounded-r-lg mt-2">
                        <div className="flex items-start gap-2">
                          {/* <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div> */}
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium mb-1">
                              Verification Remarks
                            </p>
                            <p className="text-sm text-blue-700 leading-relaxed">
                              {application.ministryRemarks ||
                                "No remarks provided."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const blob =
                          await applicationAPI.downloadVerificationDocument(
                            application.id
                          );
                        const url = URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `verification-document-${application.id.substring(
                          0,
                          8
                        )}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      } catch (error) {
                        console.error("Download failed:", error);
                        showNotification.error("Failed to download document");
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* Agency Verification Remarks */}
                {application.agencyRemarks &&
                  application.agencyRemarks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-4">
                        Verification Remarks
                      </h4>
                      <div className="space-y-4">
                        {application.agencyRemarks.map(
                          (remark: any, index: number) => (
                            <div
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="font-medium text-gray-800">
                                    {remark.agency || "Unknown Agency"}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {remark.submittedAt
                                    ? formatDateTime(remark.submittedAt)
                                    : "N/A"}
                                </span>
                              </div>

                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-2">
                                  Remarks:
                                </div>
                                <div className="bg-white rounded-lg p-3 text-gray-800 border border-gray-200">
                                  {remark.remarks || "No remarks provided"}
                                </div>
                              </div>

                              {remark.attachmentUrl && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">
                                        Agency Attachment
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <PDFLink
                                        url=""
                                        fileName={`verification-${remark.agency}-${remark.submittedAt}.pdf`}
                                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                        applicationId={params.id as string}
                                        agency={remark.agency}
                                      >
                                        <Eye className="h-3 w-3" />
                                        View
                                      </PDFLink>
                                      <span className="text-gray-400">|</span>
                                      <button
                                        onClick={async () => {
                                          try {
                                            const blob =
                                              await applicationAPI.downloadVerificationAttachment(
                                                params.id as string,
                                                remark.agency
                                              );
                                            const downloadUrl =
                                              URL.createObjectURL(blob);

                                            const link =
                                              document.createElement("a");
                                            link.href = downloadUrl;
                                            link.download = `verification-${remark.agency}-${remark.submittedAt}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);

                                            setTimeout(
                                              () =>
                                                URL.revokeObjectURL(
                                                  downloadUrl
                                                ),
                                              1000
                                            );
                                          } catch (error) {
                                            console.error(
                                              "Download failed:",
                                              error
                                            );
                                            showNotification.error(
                                              "Failed to download file"
                                            );
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                      >
                                        <Download className="h-3 w-3" />
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agency Verification Responses - For Ministry and Admin Users */}
        {(role === "MINISTRY" || role === "ADMIN") &&
          application.agencyRemarks &&
          application.agencyRemarks.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Agency Verification Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.agencyRemarks.map(
                    (remark: any, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-3xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3 ">
                          <div className="flex items-center gap-2 ">
                            {/* <div className="w-2 h-2 rounded-full bg-green-500"></div> */}
                            <span className="font-medium text-gray-800">
                              {remark.agency || "Unknown Agency"}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {remark.submittedAt
                              ? formatDateTime(remark.submittedAt)
                              : "N/A"}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-2">
                            Verification Remarks:
                          </div>
                          <div className="bg-white rounded-2xl p-3 text-gray-800 border border-gray-200 ">
                            {remark.remarks || "No remarks provided"}
                          </div>
                        </div>

                        {remark.attachmentUrl && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                  Agency Attachment
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <PDFLink
                                  url=""
                                  fileName={`verification-${remark.agency}-${remark.submittedAt}.pdf`}
                                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                  applicationId={params.id as string}
                                  agency={remark.agency}
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </PDFLink>
                                <span className="text-gray-400">|</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      const blob =
                                        await applicationAPI.downloadVerificationAttachment(
                                          params.id as string,
                                          remark.agency
                                        );
                                      const downloadUrl =
                                        URL.createObjectURL(blob);

                                      const link = document.createElement("a");
                                      link.href = downloadUrl;
                                      link.download = `verification-${remark.agency}-${remark.submittedAt}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      setTimeout(
                                        () => URL.revokeObjectURL(downloadUrl),
                                        1000
                                      );
                                    } catch (error) {
                                      console.error("Download failed:", error);
                                      showNotification.error(
                                        "Failed to download file"
                                      );
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {canPerformAction && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {/* Debug info */}
                {/* <div className="w-full text-xs text-gray-500 mb-2">
                  Debug: Role={role}, Status={application?.status}, CanPerformAction={canPerformAction}
                </div> */}

                {/* Agency Actions for Verification */}
                {role === "AGENCY" &&
                  application.status === "PENDING_VERIFICATION" && (
                    <Button
                      onClick={() => setShowSubmitVerificationModal(true)}
                      disabled={isActionLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Submit Verification
                    </Button>
                  )}

                {/* Ministry Actions for DRAFT Applications */}
                {(role === "MINISTRY" || role === "ADMIN") &&
                  application.status === "DRAFT" && (
                    <>
                      <Button
                        onClick={() => setShowDraftReviewModal(true)}
                        disabled={isActionLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Review
                        Application
                      </Button>
                      <Button
                        onClick={() => setShowSendForVerificationModal(true)}
                        disabled={isActionLoading}
                      >
                        <Send className="mr-2 h-4 w-4" /> Send for Verification
                      </Button>
                    </>
                  )}

                {/* Ministry Actions for VERIFICATION_SUBMITTED Applications */}
                {(role === "MINISTRY" || role === "ADMIN") &&
                  application.status === "VERIFICATION_SUBMITTED" && (
                    <>
                      <Button
                        onClick={() => setShowMinistryReviewModal(true)}
                        disabled={isActionLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Review
                        Application
                      </Button>
                    </>
                  )}

                {/* Ministry Actions for VERIFICATION_RECEIVED Applications */}
                {(role === "MINISTRY" || role === "ADMIN") &&
                  application.status === "VERIFICATION_RECEIVED" && (
                    <>
                      <Button
                        onClick={() => setShowDraftReviewModal(true)}
                        disabled={isActionLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Review
                        Application
                      </Button>
                      <Button
                        onClick={() => setShowSendForVerificationModal(true)}
                        disabled={isActionLoading}
                      >
                        <Send className="mr-2 h-4 w-4" /> Send for Verification
                      </Button>
                    </>
                  )}

                {/* Ministry Actions for Other Statuses (Legacy workflow) */}
                {(role === "MINISTRY" || role === "ADMIN") &&
                  [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "AGENCY_REVIEW",
                    "MINISTRY_REVIEW",
                  ].includes(application.status) && (
                    <>
                      <Button
                        onClick={() => setShowMinistryReviewModal(true)}
                        disabled={isActionLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Review
                        Application
                      </Button>
                      <Button
                        onClick={handleSendToAgency}
                        variant="secondary"
                        disabled={isActionLoading}
                      >
                        <Send className="mr-2 h-4 w-4" /> Send to Agency
                      </Button>
                    </>
                  )}

                {/* Print Action for Mission Operator, Ministry, and Admin */}
                {canPrint && (
                  <Button
                    onClick={handleNavigateToPrint}
                    disabled={isActionLoading}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Application
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <SendForVerificationModal
        isOpen={showSendForVerificationModal}
        onClose={() => setShowSendForVerificationModal(false)}
        onSubmit={handleSendForVerification}
        isLoading={isActionLoading}
      />

      <SubmitVerificationModal
        isOpen={showSubmitVerificationModal}
        onClose={() => setShowSubmitVerificationModal(false)}
        onSubmit={handleSubmitVerification}
        isLoading={isActionLoading}
        applicationId={application?.id}
      />

      {/* <MinistryReviewModal
        isOpen={showMinistryReviewModal}
        onClose={() => setShowMinistryReviewModal(false)}
        onApprove={handleMinistryReviewApprove}
        onReject={handleMinistryReviewReject}
        isLoading={isActionLoading}
      /> */}

      <DraftReviewModal
        isOpen={showDraftReviewModal}
        onClose={() => setShowDraftReviewModal(false)}
        onApprove={handleDraftApprove}
        onReject={handleDraftReject}
        isLoading={isActionLoading}
      />
      {/* QC Modal */}
      <QCModal
        application={selectedApplication}
        isOpen={qcModalOpen}
        onClose={() => {
          setQcModalOpen(false);
          setSelectedApplication(null);
        }}
        onSuccess={handleQcSuccess}
      />
    </div>
  );
}

// allow passing className and control columns
function Section({
  title,
  children,
  className = "",
  cols = 2, // 1 or 2
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2;
}) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-gray-200 p-6 flex flex-col h-full ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-3">
        {title}
      </h3>
      <div
        className={`grid grid-cols-1 ${
          cols === 2 ? "md:grid-cols-2" : ""
        } gap-4 flex-1`}
      >
        {children}
      </div>
    </div>
  );
}

function GridItem({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value?: string | React.ReactNode;
  className?:string;
  mono?: boolean;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <div className={`text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>
        {value || "-"}
      </div>
    </div>
  );
}
