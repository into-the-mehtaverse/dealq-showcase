import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  className = ''
}: MetricsCardProps) {
  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>

          {/* Value */}
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
