"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building, CheckCircle, Clock, XCircle } from "lucide-react";

interface PipelineMetricsProps {
  totalDealsCount: number;
  activeDealsCount: number;
  draftDealsCount: number;
  deadDealsCount: number;
  className?: string;
}

export default function PipelineMetrics({
  totalDealsCount,
  activeDealsCount,
  draftDealsCount,
  deadDealsCount,
  className = "",
}: PipelineMetricsProps) {
  const metrics = [
    {
      title: "Total Deals",
      value: totalDealsCount,
      icon: Building,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      description: "All deals in pipeline"
    },
    {
      title: "Active Deals",
      value: activeDealsCount,
      icon: CheckCircle,
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600",
      description: "Deals in active status"
    },
    {
      title: "Draft Deals",
      value: draftDealsCount,
      icon: Clock,
      iconBgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      description: "Deals in draft status"
    },
    {
      title: "Dead Deals",
      value: deadDealsCount,
      icon: XCircle,
      iconBgColor: "bg-red-100",
      iconColor: "text-red-600",
      description: "Deals in dead status"
    }
  ];

  return (
    <Card className={`bg-background mb-8 border-0 shadow-none ${className}`}>
      <CardHeader className="pb-0 -mb-2 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-700 tracking-wide">
          PIPELINE OVERVIEW:
        </h2>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={metric.title}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.iconBgColor}`}>
                    <IconComponent className={`h-6 w-6 ${metric.iconColor}`} />
                  </div>
                </div>

                <div className="mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {metric.value.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-slate-600">
                    {metric.title}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
