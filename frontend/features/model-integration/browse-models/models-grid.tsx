"use client";

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Building, FileSpreadsheet } from 'lucide-react';
import ModelCard from './model-card';
import { Model } from '../types';

interface ModelsGridProps {
  models: Model[];
  onModelViewDetails?: (modelId: string) => void;
  onAddModel?: () => void;
  className?: string;
}

export default function ModelsGrid({
  models,
  onModelViewDetails,
  onAddModel,
  className = ""
}: ModelsGridProps) {
  // Separate models by type
  const { templateModels, customModels } = useMemo(() => {
    const templates = models.filter(model => model.type === 'template');
    const customs = models.filter(model => model.type === 'custom');
    return { templateModels: templates, customModels: customs };
  }, [models]);

  const handleModelViewDetails = (modelId: string) => {
    onModelViewDetails?.(modelId);
  };

  const handleAddModel = () => {
    onAddModel?.();
  };

  const renderModelSection = (
    title: string,
    models: Model[],
    icon: React.ComponentType<{ className?: string }>,
    description: string,
    emptyMessage: string,
    addButtonText: string,
    showAddButton: boolean = false
  ) => (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {(() => {
            const IconComponent = icon;
            return <IconComponent className="w-5 h-5 text-slate-600" />;
          })()}
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <Badge variant="outline" className="text-xs">
            {models.length}
          </Badge>
          {title === "Custom Models" && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
              Coming Soon
            </Badge>
          )}
        </div>

      </div>

      <p className="text-sm text-slate-600">{description}</p>

      {/* Models Grid */}
      {models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onViewDetails={handleModelViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            {(() => {
              const IconComponent = icon;
              return <IconComponent className="w-8 h-8 text-slate-400" />;
            })()}
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No {title.toLowerCase()} yet</h3>
          <p className="text-sm text-slate-500 mb-4">{emptyMessage}</p>
          {showAddButton && (
            <button
              onClick={handleAddModel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              {addButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* DealQ Templates Section */}
      {renderModelSection(
        "DealQ Templates",
        templateModels,
        Building,
        "Pre-built models designed by our team for common commercial real estate analysis scenarios.",
        "No template models available at the moment.",
        "Browse Templates",
        false
      )}

      {/* Separator */}
      <Separator className="my-8" />

      {/* Custom Models Section */}
      {renderModelSection(
        "Custom Models",
        customModels,
        FileSpreadsheet,
        "Your personal Excel models that have been registered and mapped for use in DealQ.",
        "You haven't registered any custom models yet. Upload your Excel file to get started.",
        "Add Model",
        true
      )}
    </div>
  );
}
