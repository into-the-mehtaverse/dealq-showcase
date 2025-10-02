"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealSummary } from '@/types/property';
import { RentRollTab } from './rent-roll';
import { T12Tab } from './t12';

interface DealSummaryTabsProps {
  children: React.ReactNode;
  dealData: DealSummary;
  className?: string;
}

export default function DealSummaryTabs({ children, dealData, className = '' }: DealSummaryTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="rent-roll"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            Rent Roll
          </TabsTrigger>
          <TabsTrigger
            value="t12"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            T-12
          </TabsTrigger>
          <TabsTrigger
            value="comps"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            Comps
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="mt-0">
            {children}
          </TabsContent>

          <TabsContent value="rent-roll" className="mt-0">
            <RentRollTab dealData={dealData} />
          </TabsContent>

          <TabsContent value="t12" className="mt-0">
            <T12Tab dealData={dealData} />
          </TabsContent>

          <TabsContent value="comps" className="mt-0">
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Comps Coming Soon
                </h3>
                <p className="text-sm text-gray-600 max-w-xs">
                  Comparable property analysis and market data will be available in the next update.
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
