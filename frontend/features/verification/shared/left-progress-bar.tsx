"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProgressStep {
  id: string;
  label: string;
  path: string;
  icon: string;
}

const VERIFICATION_STEPS: ProgressStep[] = [
  {
    id: 'property-details',
    label: 'Property Details',
    path: '/verify/details',
    icon: '🏢'
  },
  {
    id: 'rent-roll',
    label: 'Rent Roll',
    path: '/verify/rr',
    icon: '📋'
  },
  {
    id: 't-12',
    label: 'T-12',
    path: '/verify/t-12',
    icon: '📊'
  }
];

interface LeftProgressBarProps {
  currentStep?: string;
  className?: string;
}

export default function LeftProgressBar({
  currentStep,
  className = ""
}: LeftProgressBarProps) {
  const pathname = usePathname();

  // Determine current step based on pathname if not provided
  const getCurrentStep = (): string => {
    if (currentStep) return currentStep;

    const currentPath = pathname;
    const step = VERIFICATION_STEPS.find(step =>
      currentPath.startsWith(step.path)
    );

    return step?.id || 'property-details';
  };

  const activeStep = getCurrentStep();
  const activeStepIndex = VERIFICATION_STEPS.findIndex(step => step.id === activeStep);

  return (
    <div className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Verification Steps</h2>
        <p className="text-sm text-gray-600 mt-1">Complete all steps to verify your deal</p>
      </div>

      {/* Progress Steps */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {VERIFICATION_STEPS.map((step, index) => {
            const isActive = step.id === activeStep;
            const isCompleted = index < activeStepIndex;
            const isUpcoming = index > activeStepIndex;

            return (
              <Link
                key={step.id}
                href={step.path}
                className={`block relative ${
                  isActive
                    ? 'bg-blue-50 border-blue-200'
                    : isCompleted
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } border rounded-lg p-3 transition-all duration-200`}
              >
                {/* Progress Line */}
                {index < VERIFICATION_STEPS.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                )}

                <div className="flex items-center space-x-3">
                  {/* Step Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isActive
                        ? 'text-blue-900'
                        : isCompleted
                        ? 'text-green-900'
                        : 'text-gray-700'
                    }`}>
                      {step.label}
                    </div>
                    <div className={`text-xs ${
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {isActive ? 'Current Step' : isCompleted ? 'Completed' : 'Upcoming'}
                    </div>
                  </div>

                  {/* Step Number */}
                  <div className={`text-xs font-medium ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {activeStepIndex + 1} of {VERIFICATION_STEPS.length}
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((activeStepIndex + 1) / VERIFICATION_STEPS.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
