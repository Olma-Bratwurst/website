"use client";

import React from "react";

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

export function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
  return (
    <div className="flex flex-wrap items-center space-x-2 space-y-2">
      {children}
    </div>
  );
}
