"use client";

import React from "react";

interface DGIPHeaderWithWatermarksProps {
  leftLogoSrc?: string;
  rightLogoSrc?: string;
  bannerSrc?: string;
  opacityRight?: number;
  zIndex?: number;
}

export const DGIPHeaderWithWatermarks: React.FC<DGIPHeaderWithWatermarksProps> = ({
  leftLogoSrc = "/govt-of-pakistan-logo.png",
  rightLogoSrc = "/cmyk-dgip-logo.png",
  bannerSrc = "/banner.png",
  opacityRight = 0.1,
  zIndex = "-1"
}) => {
  return (
    <>
      {/* Watermarks Layer */}
      <div className="fixed inset-0 pointer-events-none select-none z-10 overflow-hidden">
        {/* Left watermark */}
        <img
          src={leftLogoSrc}
          alt=""
          className="pointer-events-none select-none fixed top-2/3"
          style={{
            width: "250px",
            height: "auto",
            left: "-50px",
            transform: "translateY(-5%)",
            opacity: 1,
            zIndex: zIndex
          }}
        />

        {/* Right watermark */}
        <img
          src={rightLogoSrc}
          alt=""
          className="pointer-events-none select-none fixed top-2/3"
          style={{
            right: "-50px",
            width: "280px",
            transform: "translateY(-5%)",
            height: "auto",
            opacity: opacityRight,
            zIndex: zIndex
          }}
        />
      </div>

      {/* Header Banner */}
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="flex items-center justify-center mb-4 select-none">
          <div className="flex items-center gap-3">
            <img 
              src={bannerSrc} 
              alt="DGIP Logo" 
              className="w-full h-full" 
            />
           
          </div>
        </div>
      </div>
    </>
  );
};  