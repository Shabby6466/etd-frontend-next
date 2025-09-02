"use client";
import React from "react";

type Props = {
  logoSrc?: string;
};

export default function DGIPHeader({
  logoSrc = "/banner.png",
}: Props) {
  return (
    <div className="max-w-8xl mx-auto relative z-10">
      <div className="flex items-center justify-center mb-4 select-none">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="DGIP Logo" className="w-[1102px] h-full" />
       
        </div>
      </div>
    </div>
  );
}