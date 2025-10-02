import { Building, DollarSign, Clock, CheckCircle } from 'lucide-react';
import GridWidgetCard from './grid-widget-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface GridWidgetProps {
  activeDealsCount: number;
  totalValue: number;
  draftDealsCount: number;
  last30DaysDealsCount: number;
}

export default function GridWidget({ activeDealsCount, totalValue, draftDealsCount, last30DaysDealsCount }: GridWidgetProps) {
  // Format total value to millions
  const formatTotalValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$$value`;
  };

  return (
    <Card className="bg-background mb-8 border-0 shadow-none">

      <CardHeader className="pb-0 -mb-2 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-700 tracking-wide">
          PIPELINE OVERVIEW:
        </h2>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Deals */}
          <GridWidgetCard
            title="Active Deals"
            value={activeDealsCount}
            icon={Building}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            trend={{
              value: 8,
              isPositive: true,
              label: "from last month"
            }}
          />

          {/* Total Value */}
          <GridWidgetCard
            title="Total Value"
            value={formatTotalValue(totalValue)}
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            trend={{
              value: 12,
              isPositive: true,
              label: "from last month"
            }}
          />

          {/* Deals Needing Review */}
          <GridWidgetCard
            title="Needs Review"
            value={draftDealsCount}
            icon={Clock}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            trend={{
              value: 2,
              isPositive: false,
              label: "from last month"
            }}
          />

          {/* Total Deals Reviewed */}
          <GridWidgetCard
            title="Reviewed"
            value={last30DaysDealsCount}
            icon={CheckCircle}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            trend={{
              value: 15,
              isPositive: true,
              label: "from last month"
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
