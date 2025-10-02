"use client";

import VerifyT12 from "@/features/verification/t12/verify-t12";

export default function T12VerifyPage() {
  return (
    <div className="space-y-6">
      {/* T12 Component */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">T12 Verification</h2>
          <p className="text-sm text-gray-600 mt-1">
            Verify and edit trailing 12 months financial information extracted from your documents
          </p>
        </div>
        <VerifyT12 />
      </div>
    </div>
  );
}
