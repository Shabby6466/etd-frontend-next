import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatting";

interface DocumentPreviewProps {
  application: Application;
}
export default function DocumentPreview({ application }: DocumentPreviewProps) {
  return (
    <div className="lg:col-span-2 justify-center items-center">
      {/* Document Container */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="max-w-[491.34px] mx-auto overflow-hidden bg-white print:p-0 print:m-0 print:max-w-none">
          {/* Document Container - Following exact dimensions from image */}
          <div className="relative bottom-0 w-[500.34px] h-[1020px] print:border-0 print-document z-0">
            <img
              src="/etd-bg.JPEG"
              alt="Guideline"
              className="absolute inset-0 w-full h-full opacity-100 pointer-events-none print:hidden z-0"
            /> 
            {/* Data Container - Following exact dimensions from image */}
            <div >
              {" "}
              {/* TOP SECTION (1st half) - Blank header area */}
              <div className="absolute top-0 left-0 w-full h-[340px]">
                {/* Top border */}{" "}
                <div className="absolute top-0 left-0 w-full h-[1px]"></div>
                {/* Right border */}
                <div className="absolute top-0 right-0 w-[1px] h-full"></div>
              </div>{" "}
              {/* MID SECTION (2nd half) - Blank header area */}
              <div className="absolute top-[340px] left-0 w-full h-[340px]">
              </div>
              {/* BOTTOM SECTION (3rd half) - ETD document */}
              <div className="absolute bottom-0 left-0 w-full h-[340px]">
                {/* Left side - Photograph */}
                {application.image && (
                  <div className="absolute left-[6mm] bottom-[23.3mm] right-[15mm]" style={{ width: "35mm", height: "45mm" }}>
                    <img
                      src={`data:image/jpeg;base64,${application.image}`}
                      alt="Citizen Photograph"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}{" "}
                {/* Right side - Document information */}{" "}
                <div className="absolute left-[50mm] bottom-[20mm] right-[120px]">
                  {" "}
                  {/* Top row - Type, Country Code, Document No */}{" "}
                  <div className="flex justify-between items-center mb-1">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Type <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.type}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Country Code <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.country_code}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Document No. <br />{" "}
                        <span
                          className="text-[11px] font-semibold "
                          style={{
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.document_no}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Personal Information - Left column */}{" "}
                  <div className="grid grid-cols-2 gap-x-14 gap-y-1">
                    {" "}
                    <div className="flex items-center gap-4 gap-y-[1px]">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Surname <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.lastName?.toUpperCase()}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div></div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Given Names <br />{" "}
                        <span
                          className="text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.firstName?.toUpperCase()}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div></div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Father Name <br />{" "}
                        <span
                          className="text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.fatherName?.toUpperCase()}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div></div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Citizen Number <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.citizenId}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Sex <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.gender?.toUpperCase() === "MALE"
                            ? "M"
                            : "F"}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Nationality <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.nationality}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Tracking Number <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.tracking_id}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Date of birth <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {formatDate(application.dateOfBirth)}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Issuing Authority <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.processing?.nationality}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Date of issue <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.etdIssueDate
                            ? formatDate(application.etdIssueDate)
                            : formatDate(application.updatedAt)}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-4">
                      {" "}
                      <span className="text-[8px] text-gray-500 leading-[1.1]">
                        {" "}
                        Date of expiry <br />{" "}
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            fontFamily: "Tahoma, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          {" "}
                          {application.etdExpiryDate
                            ? formatDate(application.etdExpiryDate)
                            : "3 MONTHS FROM ISSUE"}{" "}
                        </span>{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Bottom - Machine Readable Zone (MRZ) */}{" "}
                <div className="absolute bottom-[4mm] left-[65mm] -translate-x-1/2 text-center">
                  {" "}
                  <div
                    className="text-[14px] leading-tight tracking-[0.13em]"
                    style={{ fontFamily: "OCR-B, monospace" }}
                  >
                    {" "}
                    {application?.processing?.mrz_line1}{" "}
                  </div>{" "}
                  <div
                    className="text-[14px] leading-tight leading-tight tracking-[0.13em]"
                    style={{ fontFamily: "OCR-B, monospace" }}
                  >
                    {application?.processing?.mrz_line2}{" "}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
