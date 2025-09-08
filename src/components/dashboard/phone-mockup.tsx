
'use client';

import { cn } from "@/lib/utils";
import { Case, Camera, Speaker } from 'lucide-react';
import React from "react";

type PhoneMockupProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[550px] w-[280px] shadow-xl", className)}>
        <div className="w-[140px] h-[14px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
        <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[13px] top-[64px] rounded-l-lg"></div>
        <div className="h-[42px] w-[3px] bg-gray-800 absolute -left-[13px] top-[124px] rounded-l-lg"></div>
        <div className="h-[42px] w-[3px] bg-gray-800 absolute -left-[13px] top-[178px] rounded-l-lg"></div>
        <div className="h-[54px] w-[3px] bg-gray-800 absolute -right-[13px] top-[142px] rounded-r-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background">
            {children}
        </div>
    </div>
  );
}
