"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";

interface DealAnalytics {
  dealsAnalyzed: number;
  totalValue: number;
  period: string;
  changeFromLastPeriod: number;
}

interface HeaderWidgetProps {
  analytics?: DealAnalytics;
}

export default function HeaderWidget({ analytics }: HeaderWidgetProps) {
  // Placeholder data - in real implementation, this would come from props or API
  const defaultAnalytics: DealAnalytics = {
    dealsAnalyzed: 12,
    totalValue: 24500000,
    period: "last 30 days",
    changeFromLastPeriod: 15.3
  };

  const data = analytics || defaultAnalytics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return `${isPositive ? '+' : ''}${change}%`;
  };

  return (
    <Card className="mb-6 bg-sidebar shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {data.dealsAnalyzed} Deals Analyzed
              </h2>
              <p className="text-slate-600 text-sm">
                in the {data.period}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Total Value</span>
              </div>
              <p className="text-xl font-semibold text-slate-900">
                {formatCurrency(data.totalValue)}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">vs last period</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge
                  variant={data.changeFromLastPeriod >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {formatChange(data.changeFromLastPeriod)}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Period</span>
              </div>
              <p className="text-sm font-medium text-slate-900 capitalize">
                {data.period}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
