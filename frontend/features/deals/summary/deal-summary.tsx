"use client";

import React, { useEffect } from 'react';
import DealSummaryTabs from './deal-summary-tabs';
import ExcelDownload from './excel-download';
import OMViewer from './om-viewer';
import MetricsGrid from './metrics-grid';
import AssetSummaryCard from './asset-summary-card';
import DealDescription from './deal-description';
import MarketDescription from './market-description';
import DealMap from './deal-map';
import UnsavedChangesAlert from './unsaved-changes-alert';
import DealActions from './deal-actions';
import { useDealSelectors, useDealActions } from './store';
import { useUnsavedChangesWarning } from './hooks';

interface DealSummaryProps {
  dealId: string;
  className?: string;
}

export default function DealSummary({ dealId, className = '' }: DealSummaryProps) {
  // Get store data and actions
  const dealData = useDealSelectors.useDealData();
  const calculatedMetrics = useDealSelectors.useCalculatedMetrics();
  const isLoading = useDealSelectors.useIsLoading();
  const error = useDealSelectors.useError();
  const hasDealData = useDealSelectors.useHasDealData();
  const { fetchDeal } = useDealActions();

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning();

  // Fetch deal data on component mount
  useEffect(() => {
    if (dealId) {
      fetchDeal(dealId);
    }
  }, [dealId, fetchDeal]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading deal data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Deal</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDeal(dealId)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!hasDealData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Deal Data</h3>
          <p className="text-sm text-gray-600">No deal information found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 mt-4 ${className}`}>
      {/* Unsaved Changes Alert - appears at top when there are changes */}
      <UnsavedChangesAlert />

      <div className="flex items-center justify-between mb-6">
        <div className="text-2xl font-bold">{dealData?.property_name}</div>
        <DealActions
          dealId={dealId}
          propertyName={dealData?.property_name}
          onDealDeleted={() => {
            // Handle deal deletion - could redirect to dashboard
            window.location.href = '/dashboard/deals';
          }}
        />
      </div>
      {/* Tabs at the top */}
      <DealSummaryTabs dealData={dealData!}>
        {/* Overview tab content */}

        <div className="space-y-6">
          {/* Excel Download */}
          <ExcelDownload dealData={dealData!} className="" />



          {/* Two-column layout: OM Viewer (2/3) + Right Side Cards (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: OM Viewer - takes up 2/3 of the space */}
            <div className="lg:col-span-2">
              <OMViewer dealData={dealData!} />
            </div>

            {/* Right: Two stacked cards - takes up 1/3 of the space */}
            <div className="lg:col-span-1 space-y-5">
              {/* Top: Asset Summary Card */}
              <AssetSummaryCard dealData={dealData!} />

              {/* Bottom: Snapshot Metrics Card */}
              <MetricsGrid dealData={dealData!} calculatedMetrics={calculatedMetrics} />
            </div>
          </div>

          {/* Deal Description */}
          <DealDescription description={dealData?.description} />

          {/* Two-column layout for Market Description and Deal Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Market Description */}
            <div>
              <MarketDescription marketDescription={dealData?.market_description} />
            </div>
            {/* Right: Deal Map */}
            <div>
              <DealMap />
            </div>
          </div>
        </div>
      </DealSummaryTabs>
    </div>
  );
}
