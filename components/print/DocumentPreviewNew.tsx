import { Application } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatting";

interface DocumentPreviewNewProps {
  application: Application;
}

export default function DocumentPreviewNew({ application }: DocumentPreviewNewProps) {
  // Convert mm to pixels: 124mm × 263mm at 96 DPI
  // 1mm ≈ 3.78 pixels at 96 DPI
  const widthPx = 468.66141732; // ≈ 469px
  const heightPx = 994.01574803; // ≈ 994px

  return (
    <>
      <style jsx>{`
        @media print {
          .print-document {
            position: absolute !important;
            bottom: 40px !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
            width: 124mm !important;
            height: 270mm !important;
            max-width: 124mm !important;
            max-height: 270mm !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
          }
          @page {
            margin: 0 !important;
            page-break-after: avoid !important;
          }
          * {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
        }
      `}</style>
      <div className="lg:col-span-2 justify-center items-center">
      {/* New Design Document Container */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none transition-all duration-300 ease-in-out">
        <div className="mx-auto overflow-hidden bg-white print:p-0 print:m-0 print:max-w-none">
          {/* New Design Document Container - 124mm × 263mm */}
          <div 
            className="relative print:border-0 print-document"
            style={{ 
              width: `${widthPx}px`, 
              height: `${heightPx}px`,
              maxWidth: `${widthPx}px`,
              maxHeight: `${heightPx}px`,
              pageBreakAfter: 'avoid',
              pageBreakInside: 'avoid'
            }}
          >
            {/* <img
              src="/etd-new-leaf.jpg"
              alt="New Design Template"
              className="absolute inset-0 w-full h-full opacity-100 pointer-events-none print:hidden z-0 transition-opacity duration-300 ease-in-out"
            />  */}
            
            {/* New Design Data Container - Passport-like three-section layout */}
            <div className="absolute inset-0 w-full h-full z-10">
              {/* 
                Passport-like layout with three sections:
                1. TOP: Observations, remarks, physical characteristics
                2. MIDDLE: Main personal info with photo (left to right)
                3. BOTTOM: MRZ (Machine Readable Zone)
                Document dimensions: 124mm × 263mm (≈ 469px × 994px at 96 DPI)
              */}
              {/* ===== REMARKS SECTION - Left Side Rotated ===== */}
              <div 
                className="absolute" 
                style={{ 
                  top: '250px', 
                  left: '200px', 
                  width: '400px',
                  height: '1800px',
                  transform: 'rotate(270deg)',
                  transformOrigin: 'left top'
                }}
              >
                {/* Departure Date */}
                <div className="text-black font-bold text-[6px]" style={{ top: '0px', left: '0px', position: 'absolute' }}>Expected Date Of Travel</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '30px', left: '0px', position: 'absolute' }}>{ '______________________'}</div>
                
                {/* Reason of Deportation */}
                <div className="text-black font-bold text-[6px]" style={{ top: '60px', left: '0px', position: 'absolute' }}>Reason of Deportation</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '65px', left: '0px', position: 'absolute' }}>{application.reason_for_deport || 'N/A'}</div>
                
                {/* Fare */}
                <div className="text-black font-bold text-[6px]" style={{ top: '90px', left: '0px', position: 'absolute' }}>Fare</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '95px', left: '0px', position: 'absolute' }}>{application.securityDeposit || 'N/A'}</div>
                


                {/* Agency Paying Fare */}
                <div className="text-black font-bold text-[6px]" style={{ top: '120px', left: '0px', position: 'absolute' }}>Agency Paying Fare</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '125px', left: '0px', position: 'absolute' }}>ABU DHABI</div>

                <div className="text-black font-bold text-[6px]" style={{ top: '150px', left: '0px', position: 'absolute' }}>Security Deposit Decription</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '155px', left: '0px', position: 'absolute' }}>PAID</div>
              
              </div>  
                
              {/* ===== TOP SECTION - Observations and Physical Characteristics ===== */}
              <div 
                className="absolute" 
                style={{ 
                  bottom: '420px', 
                  left: '200px', 
                  width: '180px',
                  height: '200px',
                  transform: 'rotate(270deg)',
                  transformOrigin: 'center'
                }}
              >
                {/* Height */}
                <div className="text-black font-bold text-[6px]" style={{ top: '0px', left: '0px', position: 'absolute' }}>Height</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '5px', left: '0px', position: 'absolute' }}>{application.height || 'N/A'}</div>
                
                {/* Color of Hair */}
                <div className="text-black font-bold text-[6px]" style={{ top: '30px', left: '0px', position: 'absolute' }}>Color Of Hair</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '35px', left: '0px', position: 'absolute' }}>{application.colorOfHair || 'N/A'}</div>
                
                {/* Profession */}
                <div className="text-black font-bold text-[6px]" style={{ top: '60px', left: '0px', position: 'absolute' }}>Profession</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '65px', left: '0px', position: 'absolute' }}>{application.profession || 'N/A'}</div>
                
                {/* Permanent Address */}
                <div className="text-black font-bold text-[6px]" style={{ top: '90px', left: '0px', position: 'absolute' }}>Permanent Address</div>
                <div className="text-black font-normal text-[12px] leading-tight" style={{ top: '95px', left: '0px', position: 'absolute' }}>{application.pakistanAddress || 'N/A'}</div>
                
                {/* Temporary Address */}
                <div className="text-black font-bold text-[6px]" style={{ top: '120px', left: '0px', position: 'absolute' }}>Temporary Address</div>
                <div className="text-black font-normal text-[12px] leading-tight" style={{ top: '125px', left: '0px', position: 'absolute' }}>{application.pakistanAddress || 'N/A'}</div>
                
                {/* Color of Eyes */}
                <div className="text-black font-bold text-[6px]" style={{ top: '0px', left: '100px', position: 'absolute' }}>Color of Eyes</div>
                <div className="text-black font-normal text-[12px]" style={{ top: '5px', left: '100px', position: 'absolute' }}>{application.colorOfEyes || 'N/A'}</div>
              </div>
              
              
              
              
              {/* ===== MIDDLE SECTION - Main Personal Information (Left to Right) ===== */}
              
              {/* Photograph - Left side */}
              {application.image && (
                <div 
                  className="absolute" 
                  style={{ 
                    top: '770px', 
                    left: '20px', 
                    width: '120px', 
                    height: '145px' 
                  }}
                >
                  <img
                    src={`data:image/jpeg;base64,${application.image}`}
                    alt="Citizen Photograph"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Main Personal Info - Center (left to right arrangement) */}
              
              {/* Left column labels and data */}
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '717px', left: '150px' }}>
                Type
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '722px', left: '150px' }}>
                PE
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '717px', left: '202px' }}>
                Country Code
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '722px', left: '202px' }}>
                PAK
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '717px', left: '300px' }}>
                Passport Number
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '722px', left: '300px' }}>
                PT456985
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '735px', left: '150px' }}>
                Sur Name
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '740px', left: '150px' }}>
                {application.lastName.toUpperCase()}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '754px', left: '150px' }}>
                Given Name
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '759px', left: '150px' }}>
                {application.firstName.toUpperCase()}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '773px', left: '150px' }}>
                Nationality
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '778px', left: '150px' }}>
                {application.processing?.nationality.toUpperCase()}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '792px', left: '150px' }}>
                Date of Birth
              </div>
                <div className="absolute text-black font-normal text-[12px]" style={{ top: '797px', left: '150px' }}>
                {application.dateOfBirth.toUpperCase()}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '810px', left: '150px', width: '60px' }}>
                Sex
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '815px', left: '150px', width: '60px' }}>
                {formatDate(application.gender.slice(0, 1)).toUpperCase()}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '810px', left: '202px' }}>
                Place of Birth
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '815px', left: '202px' }}>
                {application.birthCity?.toUpperCase() || 'N/A'}, PAK
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '828px', left: '150px' }}>
                Father Name
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '833px', left: '150px' }}>
                {application.fatherName.toUpperCase()}
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '846px', left: '150px' }}>
                Religion
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '851px', left: '150px' }}>
                ISLAM
              </div>
                <div className="absolute text-black font-bold text-[6px]" style={{ top: '864px', left: '150px' }}>
                Date of Issue
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '869px', left: '150px' }}>
                {formatDate(application.etdIssueDate).toUpperCase()}
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '882px', left: '150px' }}>
                Date of Expiry
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '887px', left: '150px' }}>
                {formatDate(application.etdExpiryDate).toUpperCase()}
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '900px', left: '150px' }}>
                Tracking Number
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '905px', left: '150px' }}>
                {formatDate(application.id).toUpperCase()}
              </div>
              
              {/* Right side additional info with labels */}
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '760px', left: '300px' }}>
                 {/*this will be empty*/}
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '766px', left: '300px' }}>
                {/*this will be empty*/}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '780px', left: '300px' }}>
                {/*this will be empty*/}
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '786px', left: '300px' }}>
             {/*this will be empty*/}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '790px', left: '300px' }}>
               {/*this will be empty*/}
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '796px', left: '300px' }}>
                 {/*this will be empty*/}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '810px', left: '300px' }}>
                 {/*this will be empty*/}
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '816px', left: '300px' }}>
                 {/*this will be empty*/}
              </div>
              
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '773px', left: '300px' }}>
                Citizen Number
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '778px', left: '300px' }}>
                61101-3082523-9
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '864px', left: '300px'}}>
                Issuing Authority
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '869px  ', left: '300px' }}>
              PARP, ARE
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '882px', left: '300px'}}>
                Old Passport Number, Status
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '887px  ', left: '300px' }}>
              AT321432, Stolen
              </div>
              <div className="absolute text-black font-bold text-[6px]" style={{ top: '900px', left: '300px'}}>
                Old Passport Expiry Date
              </div>
              <div className="absolute text-black font-normal text-[12px]" style={{ top: '905px  ', left: '300px' }}>
              20 DEC 2026
              </div>
              
              {/* ===== BOTTOM SECTION - MRZ (Machine Readable Zone) ===== */}
              
              {/* MRZ Line 1 - Passport format */}
               <div className="absolute text-black text-[11.5px]" style={{ top: '940px  ', left: '20px', fontFamily: '"OCR-B"' }}>
                {application.processing.mrz_line1.toUpperCase() || 'N/A'}
             </div>
             <div className="absolute text-black  text-[11.5px]" style={{ top: '965px  ', left: '20px', fontFamily: '"OCR-B" ' }}>
                {application.processing.mrz_line2.toUpperCase() || 'N/A'}
             </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
