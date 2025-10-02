"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled for file upload component
const UploadDocs = dynamic(() => import("@/features/verification/upload/upload-docs"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-600">Loading upload interface...</p>
      </div>
    </div>
  )
});

export default function UploadPage() {
  return (
    <div className="min-h-screen">
      <UploadDocs />
    </div>
  );
}
