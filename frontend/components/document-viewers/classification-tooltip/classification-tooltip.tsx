"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  ClassificationTooltipProps
} from './types';
import {
  processClassificationData
} from './utils';
import {
  TooltipHeader,
  TooltipContent,
  TooltipFooter
} from './components';
import { useTooltipPosition } from './hooks';

export default function ClassificationTooltip({
  classification,
  onPageNavigate,
  trigger,
  className = ''
}: ClassificationTooltipProps) {
  const {
    tooltipRef,
    triggerRef,
    shouldShowTooltip,
    handleTriggerInteraction,
    handleTriggerClick,
    handlePageClick
  } = useTooltipPosition({ onPageNavigate });

  // Process classification data
  const { fieldEntries, t12Pages, rentRollPages } = processClassificationData(classification);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerInteraction}
        onMouseLeave={() => {/* Mouse leave is handled by click outside in the hook */}}
        onClick={handleTriggerClick}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Tooltip */}
      {shouldShowTooltip && (
        <div
          ref={tooltipRef}
          className="absolute top-0 left-full ml-3 z-50"
        >
          <Card className="w-80 max-h-96 p-0 overflow-hidden shadow-lg border border-gray-200">
            {/* Header */}
            <TooltipHeader />

            {/* Content */}
            <TooltipContent
              fieldEntries={fieldEntries}
              onPageClick={handlePageClick}
            />

            {/* Footer with T12 and Rent Roll info */}
            <TooltipFooter
              t12Pages={t12Pages}
              rentRollPages={rentRollPages}
              onPageClick={handlePageClick}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
