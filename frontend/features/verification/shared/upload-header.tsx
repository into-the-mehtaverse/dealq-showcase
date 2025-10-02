"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Save, ArrowLeft } from "lucide-react";

interface UploadHeaderProps {
  className?: string;
  onSave?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

interface StageInfo {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
}

export default function UploadHeader({
  className,
  onSave,
  onBack,
  showBackButton = false
}: UploadHeaderProps) {
  const pathname = usePathname();

  const getCurrentStage = (): StageInfo => {
    if (pathname === '/upload') {
      return {
        title: "Upload Documents",
        description: "Upload your property documents for analysis",
        step: 1,
        totalSteps: 5
      };
    }
    if (pathname.includes('/upload/details')) {
      return {
        title: "Verify Property Details",
        description: "Review and edit property information",
        step: 2,
        totalSteps: 5
      };
    }
    if (pathname.includes('/upload/rr')) {
      return {
        title: "Verify Rent Roll",
        description: "Review unit-level rent and occupancy data",
        step: 3,
        totalSteps: 5
      };
    }
    if (pathname.includes('/upload/t-12')) {
      return {
        title: "Verify T-12",
        description: "Review financial categories and data",
        step: 4,
        totalSteps: 4
      };
    }

    // Default fallback
    return {
      title: "Upload Process",
      description: "Processing your documents",
      step: 1,
      totalSteps: 4
    };
  };

  const currentStage = getCurrentStage();

  const handleHelp = () => {
    // TODO: Implement contextual help for current stage
    console.log('Help clicked for stage:', currentStage.title);
  };

  const handleSave = () => {
    onSave?.();
  };

  const handleBack = () => {
    onBack?.();
  };

  return (
    <header className={`bg-background px-6 py-4 pt-6 ${className || ''}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Stage information */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {currentStage.title}
          </h2>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3 mr-4">
          {/* Back button (conditional) */}
          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Progress
          </Button>

          {/* Help button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHelp}
                className="h-9 w-9"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get help with {currentStage.title.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
