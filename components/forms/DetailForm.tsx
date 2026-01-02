"use client";

import type React from "react";
import { Label } from "@/components/ui/label";
import Image from "next/image"


interface DetailFormProps {
  data: any;
  title: string | "Details";
  onNext: (data: any) => void;
  onBack: () => void;
  passportPhoto?: string | null; // Add passport photo prop
  variant?: 'passport' | 'nadra';
}


export function DetailForm({ data, title, onNext, onBack, passportPhoto, variant = 'passport' }: DetailFormProps) {
  return (
    <form
      className="bg-white rounded-2xl shadow-md px-12.5 py-5 w-[408px] h-[803px]"
    >
      <div className="flex justify-center border-b border-gray-100 w-full pb-2.5 px-4">
        <h3 className="text-2xl font-semibold">{title}</h3>
      </div>

      <div className="flex justify-between px-4 pt-4">
        <div className="flex flex-col justify-between gap-4">
          {/*1. FIRST NAME */}
          <div className="relative">
            <Label
              htmlFor="firstName"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              {variant === 'nadra' ? 'Name' : 'First name'}
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {variant === 'nadra'
                ? (data?.first_name || "Not available")
                : (data?.first_name || "Not available")}
            </p>

          </div>

          {/*2. LAST NAME - Hide for NADRA as per requirement implicity via "First Name will be Name" implying single field or handle if user wants it hidden. 
               However, strictly following request: "First Name will be Name". 
               The user didn't explicitly say remove Last Name, but usually single Name replaces both. 
               Let's keep Last Name for Passport, and maybe hide or show N/A for Nadra if not mapped?
               Wait, "First Name will be Name" - I changed label above.
               For Nadra, typically we get a full name.
               Let's keep Last Name rendering but if data is missing it shows 'Not available'.
               Actually, looking at the user request: "Change Birth Country to present address and BIrth Country [sic] to permanent address".
               
               Let's act on the specified changes.
            */}
          <div className="relative ">
            <Label
              htmlFor="lastName"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Last name
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.last_name || "Not available"}
            </p>

          </div>

          {/*3. FATHERS NAME */}
          <div className="relative">
            <Label
              htmlFor="fathersName"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Fathers Name
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.father_name || "Not available"}
            </p>

          </div>

          {/*4. MOTHERS NAME */}
          <div className="relative">
            <Label
              htmlFor="mothersName"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Mothers Name
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.mother_name || "Not available"}
            </p>

          </div>

          {/*5. GENDER */}
          <div className="relative">
            <Label
              htmlFor="gender"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Gender
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.gender || "Not available"}
            </p>

          </div>

          {/*7. DOB */}
          <div className="relative">
            <Label
              htmlFor="dateOfBirth"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Date of Birth
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.date_of_birth || "Not available"}
            </p>

          </div>

          {/*8. BIRTH COUNTRY / PRESENT ADDRESS */}
          <div className="relative">
            <Label
              htmlFor="birthCountry"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              {variant === 'nadra' ? 'Present Address' : 'Birth Country'}
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {variant === 'nadra'
                ? (data?.present_address || "Not available")
                : (data?.birth_country || "Not available")}
            </p>

          </div>

          {/*9. BIRTH CITY / PERMANENT ADDRESS */}
          <div className="relative">
            <Label
              htmlFor="placeOfBirth"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              {variant === 'nadra' ? 'Permanent Address' : 'Birth City'}
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {variant === 'nadra'
                ? (data?.permanent_address || "Not available")
                : (data?.birth_city || "Not available")}
            </p>

          </div>

          {/*10. PROFESSION */}
          <div className="relative">
            <Label
              htmlFor="maritalStatus"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Profession
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.profession || "Not available"}
            </p>

          </div>
          {/*11. PAK ADDRESS - Hide/Show? 
               If Nadra is showing addresses in Birth Country/City slots, maybe we don't need this, 
               OR user requests specifically replacements above.
               The user didn't ask to change THIS field.
            */}
          {/* <div className="relative">
            <Label
              htmlFor="pakistanAddress"
              className="absolute left-3 top-3 text-xs text-gray-500"
            >
              Address
            </Label>
            <p className="mt-1 pt-6 pl-3 border-0 text-sm text-gray-800">
              {data?.pakistan_address || "Not available"}
            </p>

          </div> */}
        </div>
        <div className="mt-8">
          <Image
            src={passportPhoto || "/avatar.png"}
            alt="Citizen Photo"
            width={120}
            height={140}
            className="object-cover rounded border border-gray-300"
          />
        </div>
      </div>
    </form>
  );
}