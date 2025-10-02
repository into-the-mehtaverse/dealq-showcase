import React from 'react';
import { DealSummary } from '@/types/property';
import { UnderwritingAnalysis, UnderwritingAssumptions } from '@/lib/underwrite';
import UnderwritingPopover from './underwriting-popover';
import { useDealActions } from './store';
import { Card } from '@/components/ui/card';

interface MetricsGridProps {
  dealData: DealSummary;
  calculatedMetrics: UnderwritingAnalysis | null;
  className?: string;
}

export default function MetricsGrid({ dealData, calculatedMetrics, className = '' }: MetricsGridProps) {
  const { recalculateUnderwriting } = useDealActions();

  // Define the 8 key metrics using real calculated data or N/A fallbacks
  const metrics = [
    {
      title: 'Asking Price',
      value: dealData.asking_price ? `$${dealData.asking_price.toLocaleString()}` : 'N/A'
    },
    {
      title: 'Hold Period',
      value: calculatedMetrics?.noiProjections ? `${calculatedMetrics.noiProjections.length - 1} years` : 'N/A'
    },
    {
      title: 'NOI',
      value: calculatedMetrics?.year1NOI ? `$${calculatedMetrics.year1NOI.toLocaleString()}` : 'N/A'
    },
    {
      title: 'Cash on Cash',
      value: calculatedMetrics?.cashOnCashReturn ? `${(calculatedMetrics.cashOnCashReturn * 100).toFixed(1)}%` : 'N/A'
    },
    {
      title: 'IRR',
      value: calculatedMetrics?.irrAnalysis.leveredIRR ? `${(calculatedMetrics.irrAnalysis.leveredIRR * 100).toFixed(1)}%` : 'N/A'
    },
    {
      title: 'Equity Multiple',
      value: calculatedMetrics?.irrAnalysis.equityMultiple ? `${calculatedMetrics.irrAnalysis.equityMultiple.toFixed(2)}x` : 'N/A'
    },
    {
      title: 'Cap Rate',
      value: calculatedMetrics?.capRate ? `${(calculatedMetrics.capRate * 100).toFixed(2)}%` : 'N/A'
    },
    {
      title: 'DSCR',
      value: calculatedMetrics?.averageDSCR ? `${calculatedMetrics.averageDSCR.toFixed(2)}x` : 'N/A'
    }
  ];

  // Handle assumption changes from the popover
  const handleAssumptionsChange = async (newAssumptions: UnderwritingAssumptions) => {
    try {
      await recalculateUnderwriting(newAssumptions);
    } catch (error) {
      console.error('Failed to recalculate underwriting:', error);
      // TODO: Show error toast/notification to user
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header with title and calculator icon */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Snapshot Metrics</h2>
        <UnderwritingPopover
          dealData={dealData}
          currentMetrics={calculatedMetrics}
          onAssumptionsChange={handleAssumptionsChange}
        />
      </div>

      {/* Consolidated Metrics Layout - 4 rows of 2 metrics */}
      <div className="grid grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
            <p className="text-xl font-medium text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
