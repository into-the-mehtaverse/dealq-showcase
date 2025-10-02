"use client";

import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UnderwritingAssumptions, UnderwritingAnalysis } from '@/lib/underwrite';
import { DEFAULT_UNDERWRITING_ASSUMPTIONS } from '@/lib/underwrite';
import { calculateUnderwriting } from '@/lib/underwrite';

interface UnderwritingPopoverProps {
  dealData: {
    revenue?: number;
    expenses?: number;
    asking_price?: number;
  };
  currentMetrics: UnderwritingAnalysis | null;
  onAssumptionsChange: (newAssumptions: UnderwritingAssumptions) => void;
}

export default function UnderwritingPopover({
  dealData,
  onAssumptionsChange
}: UnderwritingPopoverProps) {
  // Local state for form inputs
  const [assumptions, setAssumptions] = useState<UnderwritingAssumptions>({
    ...DEFAULT_UNDERWRITING_ASSUMPTIONS,
    purchasePrice: dealData.asking_price || 0
  });

  // Local state for preview metrics
  const [previewMetrics, setPreviewMetrics] = useState<UnderwritingAnalysis | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'property' | 'debt'>('property');

  // Update local assumptions when deal data changes
  useEffect(() => {
    if (dealData.asking_price) {
      setAssumptions(prev => ({
        ...prev,
        purchasePrice: dealData.asking_price!
      }));
    }
  }, [dealData.asking_price]);

  // Calculate preview metrics when assumptions change
  useEffect(() => {
    if (dealData.revenue && dealData.revenue > 0 && assumptions.purchasePrice > 0) {
      try {
        const preview = calculateUnderwriting(
          dealData.revenue,
          dealData.expenses || 0,
          assumptions
        );
        setPreviewMetrics(preview);
      } catch (error) {
        console.warn('Preview calculation failed:', error);
        setPreviewMetrics(null);
      }
    }
  }, [assumptions, dealData.revenue, dealData.expenses]);

  // Handle input changes
  const handleInputChange = (field: keyof UnderwritingAssumptions, value: number) => {
    setAssumptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply changes to store
  const handleApplyChanges = () => {
    onAssumptionsChange(assumptions);
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultAssumptions = {
      ...DEFAULT_UNDERWRITING_ASSUMPTIONS,
      purchasePrice: dealData.asking_price || 0
    };
    setAssumptions(defaultAssumptions);
  };

  // Check if we can calculate preview
  const canCalculate = dealData.revenue && dealData.revenue > 0 && assumptions.purchasePrice > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-auto ml-2 hover:bg-gray-100"
        >
          <Calculator className="w-4 h-4 text-blue-600" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-6" align="end" side="right">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Adjust Assumptions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="p-2 h-auto"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('property')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'property'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Property
            </button>
            <button
              onClick={() => setActiveTab('debt')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'debt'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Debt
            </button>
          </div>

          {/* Property Tab Content */}
          {activeTab === 'property' && (
            <div className="space-y-4">
              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  min="100000"
                  step="10000"
                  value={assumptions.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter purchase price"
                />
              </div>

              {/* Revenue Growth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revenue Growth Rate
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="0.20"
                    step="0.01"
                    value={assumptions.revenueGrowth}
                    onChange={(e) => handleInputChange('revenueGrowth', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {(assumptions.revenueGrowth * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Expense Growth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Growth Rate
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="0.25"
                    step="0.01"
                    value={assumptions.expenseGrowth}
                    onChange={(e) => handleInputChange('expenseGrowth', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {(assumptions.expenseGrowth * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Hold Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hold Period
                </label>
                <select
                  value={assumptions.holdPeriodYears}
                  onChange={(e) => handleInputChange('holdPeriodYears', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 years</option>
                  <option value={5}>5 years</option>
                  <option value={7}>7 years</option>
                  <option value={10}>10 years</option>
                  <option value={15}>15 years</option>
                </select>
              </div>

              {/* Exit Cap Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Cap Rate
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.03"
                    max="0.12"
                    step="0.001"
                    value={assumptions.exitCapRate}
                    onChange={(e) => handleInputChange('exitCapRate', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {(assumptions.exitCapRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Debt Tab Content */}
          {activeTab === 'debt' && (
            <div className="space-y-4">
              {/* LTV Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan-to-Value (LTV) Ratio
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.50"
                    max="0.85"
                    step="0.01"
                    value={assumptions.ltvRatio}
                    onChange={(e) => handleInputChange('ltvRatio', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {(assumptions.ltvRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Loan Amount: ${(assumptions.purchasePrice * assumptions.ltvRatio).toLocaleString()}
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.01"
                    max="0.15"
                    step="0.001"
                    value={assumptions.interestRate}
                    onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16">
                    {(assumptions.interestRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term
                </label>
                <select
                  value={assumptions.loanTermYears}
                  onChange={(e) => handleInputChange('loanTermYears', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 years</option>
                  <option value={20}>20 years</option>
                  <option value={25}>25 years</option>
                  <option value={30}>30 years</option>
                </select>
              </div>
            </div>
          )}

          {/* Live Preview */}
          {canCalculate && previewMetrics && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Preview Changes</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">NOI:</span>
                  <span className="ml-2 font-medium">
                    ${previewMetrics.year1NOI.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cash on Cash:</span>
                  <span className="ml-2 font-medium">
                    {(previewMetrics.cashOnCashReturn * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">IRR:</span>
                  <span className="ml-2 font-medium">
                    {(previewMetrics.irrAnalysis.leveredIRR * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Equity Multiple:</span>
                  <span className="ml-2 font-medium">
                    {previewMetrics.irrAnalysis.equityMultiple.toFixed(2)}x
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cap Rate:</span>
                  <span className="ml-2 font-medium">
                    {(previewMetrics.capRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">DSCR:</span>
                  <span className="ml-2 font-medium">
                    {previewMetrics.averageDSCR.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={handleApplyChanges}
              disabled={!canCalculate}
              className="flex-1"
            >
              Apply Changes
            </Button>
          </div>

          {!canCalculate && (
            <p className="text-sm text-gray-500 text-center">
              Revenue and asking price required to calculate metrics
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
