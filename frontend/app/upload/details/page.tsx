"use client";

import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

// Dynamic import with SSR disabled for components that use browser APIs
const VerifyDetails = dynamic(() => import('@/features/verification/property-details/verify-details'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-600">Loading verification details...</p>
      </div>
    </div>
  )
});

export default function PropertyDetailsPage() {
  const router = useRouter();

  const handleContinueToRentRoll = () => {
    router.push('/upload/rr');
  };

  return (
    <div className="space-y-6">
      {/* Property Details Component */}
      <VerifyDetails
        className="mb-6"
      />

      {/* Continue to Rent Roll Button */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={handleContinueToRentRoll}
          size="lg"
          className="px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FileText className="h-5 w-5 mr-3" />
          Continue to Rent Roll Verification
          <ArrowRight className="h-5 w-5 ml-3" />
        </Button>
      </div>
    </div>
  );
}
