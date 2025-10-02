"use client";

import VerifyRR from "@/features/verification/rent-roll/verify-rr";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RRVerifyPage() {
  const router = useRouter();

  const handleContinueToT12 = () => {
    router.push('/upload/t-12');
  };

  return (

        <div className="space-y-6">
          {/* Rent Roll Component */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Rent Roll Verification</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verify and edit unit-by-unit rent roll information extracted from your documents
              </p>
            </div>
            <VerifyRR />
          </div>

          {/* Continue to T12 Button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleContinueToT12}
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Continue to T12 Verification
              <ArrowRight className="h-5 w-5 ml-3" />
            </Button>
          </div>
        </div>
  );
}
