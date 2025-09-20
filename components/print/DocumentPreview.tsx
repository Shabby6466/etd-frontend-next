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
        <div className="max-w-[816px] h-[1024px] mx-auto overflow-hidden bg-white print:p-0 print:m-0 print:max-w-none">
          {/* Document Container - Following exact dimensions from image */}
          <div className="relative w-[816px] h-[1024px] print:border-0 print-document">
            <img
              src="/etd-front.jpg"
              alt="Guideline"
              className="absolute inset-0 w-full h-full opacity-100 pointer-events-none print:hidden z-0"
            /> 
            {/* Data Container - Positioned absolutely over the image */}
            <div className="absolute top-[375px] left-[180px] w-full z-10">
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '0px', left: '85px' }}>
                {application.firstName.toUpperCase()} {application.lastName.toUpperCase()}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '40px', left: '130px' }}>
                {application.fatherName.toUpperCase()}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '90px', left: '120px' }}>
                {application.processing?.nationality.toUpperCase()}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '135px', left: '145px' }}>
                {'PAKISTAN'}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '180px', left: '120px' }}>
                {'N/A'}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '240px', left: '220px' }}>
                {'N/A'}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '294px', left: '220px' }}>
                {'N/A'}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '375px', left: '220px' }}>
                {'N/A'}
              </div>
              <div className="absolute text-black font-normal text-[15px]" style={{ top: '294px', left: '220px' }}>
                {'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Break for Print - Back Side */}
      <div className="print:break-before-page print:break-after-auto"></div>

      {/* Back Page Container */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="max-w-[816px] h-[1024px] mx-auto overflow-hidden bg-white print:p-0 print:m-0 print:max-w-none">
          {/* Back Page Document Container */}
          <div className="relative w-[816px] h-[1024px] print:border-0 print-document">
            <img
              src="/etd-back.jpg"
              alt="ETD Back Template"
              className="absolute inset-0 w-full h-full opacity-100 pointer-events-none print:hidden z-0"
            /> 
            {/* Back Page Data Container - Positioned absolutely over the image */}
            <div className="absolute top-[235px] left-[px] w-full z-10">
              {/* You can add back page specific data here */}
                {/* Additional information for back page */}
                  <div className="absolute text-black font-normal text-[15px]" style={{ top: '0px', left: '450px' }}>
                  {'N/A'}
                </div>
                <div className="absolute text-black font-normal text-[15px]" style={{ top: '36px', left: '300px' }}>
                  {formatDate(application.departureDate).toUpperCase()}
                </div>
                <div className="absolute text-black font-normal text-[15px]" style={{ top: '153px', left: '285px' }}>
                  {application.birthCity.toUpperCase()}
                </div>
                <div className="absolute text-black font-normal text-[15px]" style={{ top: '183px', left: '300px' }}>
                  {formatDate(application.dateOfBirth).toUpperCase()}
                </div>
                 {/* Left side - Individual positioned detail items */}
                 <div className="absolute text-black font-normal text-[15px]" style={{ top: '2115px', left: '375px' }}>
                  {'N/A'}
                 </div>
                 
                 <div className="absolute text-black font-normal text-[15px]" style={{ top: '250px', left: '230px' }}>
                  {application.height.toUpperCase() || 'N/A'}
                 </div>
                 
                 <div className="absolute text-black font-normal text-[15px]" style={{ top: '285px', left: '290px' }}>
                   {application.colorOfHair.toUpperCase()|| 'N/A'}
                 </div>
                 
                 <div className="absolute text-black font-normal text-[15px]" style={{ top: '317px', left: '280px' }}>
                  {application.colorOfEyes.toUpperCase() || 'N/A'}
                 </div>
                 
                 <div className="absolute text-black font-normal text-[13px]" style={{ top: '350px', left: '250px' }}>
                   {application.profession.toUpperCase() || 'N/A'}
                 </div>
                 
                 <div className="absolute text-black font-normal text-[13px]" style={{ top: '615px', left: '280px' }}>
                  {application.createdBy?.state?.toUpperCase() || 'N/A'}
                 </div>
                 <div className="absolute text-black font-normal text-[13px]" style={{ top: '645px', left: '220px' }}>
                  {formatDate(application.etdIssueDate).toUpperCase()   || 'N/A'}
                 </div>
                 
                 {/* Right side - Photograph */}
                 {application.image && (
                   <div className="absolute" style={{ top: '270px', left: '535px', width: '151px', height: '151px' }}>
                     <img
                       src={`data:image/jpeg;base64,${application.image}`}
                       alt="Citizen Photograph"
                       className="w-full h-full object-cover border border-gray-300"
                     />
                   </div>
                 )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
