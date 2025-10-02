import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GridWidgetCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

export default function GridWidgetCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  trend
}: GridWidgetCardProps) {
  return (
    <Card className="p-6 mb-0">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>

        {trend && (
          <div className="flex items-center gap-1">
            <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}%
            </span>
            <span className="text-sm text-slate-500">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
