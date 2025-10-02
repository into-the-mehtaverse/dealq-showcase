"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessLoadingProps {
  currentStage: string;
  percentage: number;
  className?: string;
}

export default function ProcessLoading({
  currentStage,
  percentage,
  className = ""
}: ProcessLoadingProps) {
  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardContent className="flex flex-col items-center justify-center space-y-6 p-8">
        {/* Loading Icon */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Stage Title */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentStage}
          </h3>
          <p className="text-sm text-gray-600">
            Please wait while we process your documents...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <Badge variant="secondary">{percentage}%</Badge>
          </div>
          <Progress
            value={percentage}
            className="h-3"
          />
          {percentage > 0 && percentage < 100 && (
            <p className="text-xs text-gray-500 text-center">
              {percentage >= 15 && percentage < 25 && "Starting document analysis..."}
              {percentage >= 25 && percentage < 40 && "Extracting property information..."}
              {percentage >= 40 && percentage < 55 && "Processing financial data..."}
              {percentage >= 55 && percentage < 80 && "Organizing extracted data..."}
              {percentage >= 80 && percentage < 100 && "Finalizing results..."}
            </p>
          )}
          {percentage === 100 && (
            <p className="text-xs text-green-600 text-center font-medium">
              ✓ Processing complete! Redirecting...
            </p>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This may take a few minutes depending on the size and complexity of your documents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
