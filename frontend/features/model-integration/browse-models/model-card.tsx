"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Building, Calendar, Eye, Check, Download } from 'lucide-react';
import { Model } from '../types';

interface ModelCardProps {
  model: Model;
  onViewDetails?: (modelId: string) => void;
  className?: string;
}

export default function ModelCard({
  model,
  onViewDetails,
  className = ""
}: ModelCardProps) {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails?.(model.id);
  };

  const getTypeIcon = () => {
    return model.type === 'custom' ? FileSpreadsheet : Building;
  };

  const getTypeLabel = () => {
    return model.type === 'custom' ? 'Custom Model' : 'Template Model';
  };

  const getStatusVariant = () => {
    switch (model.status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = () => {
    switch (model.status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card className="group overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-slate-200">
      <div className="relative">

        {/* Model Type Badge - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="text-xs">
            {getTypeLabel()}
          </Badge>
        </div>
      </div>

      <CardContent className="px-4 py-4">
        <div className="space-y-3">
          {/* Model Name and Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {model.name}
              </h3>
              {model.description && (
                <p className="text-sm text-slate-500 mt-1">
                  {model.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusVariant()} className="text-xs">
                {getStatusLabel()}
              </Badge>
              {model.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
          </div>

          {/* Model Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Updated {formatDate(model.updatedAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewDetails}
                className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {model.type === 'template' ? (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
