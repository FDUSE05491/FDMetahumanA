"use client";

import Trial from '@/components/Trial';
import dynamic from 'next/dynamic';

// import InteractiveAvatar from "@/components/InteractiveAvatar";
const InteractiveAvatar = dynamic(() => import("@/components/InteractiveAvatar"))

export default function App() {

  return (
    <div className="w-screen h-screen flex flex-col">
      
      <div className="flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full">
          
          <InteractiveAvatar />
        </div>
      </div>
    </div>
  );
}
