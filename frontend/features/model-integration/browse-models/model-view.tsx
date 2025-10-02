"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModelsGrid from './models-grid';
import { Model } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Building, FileSpreadsheet } from 'lucide-react';

// Mock data for development - replace with actual API calls later
const mockTemplateModels: Model[] = [
  {
    id: 'template-1',
    name: 'Standard Multifamily Model',
    description: 'Our flagship model for multifamily and mixed-use residential real estate.',
    type: 'template',
    status: 'active',
    createdAt: new Date('2025-09-17'),
    updatedAt: new Date('2025-09-17'),
    isDefault: true,
    fileUrl: '/dealq-multifamily-template-091725.xlsm'
  }
];

const mockCustomModels: Model[] = [
  {
    id: 'custom-placeholder',
    name: 'Your Custom Model',
    description: "You'll be able to access your uploaded models here.",
    type: 'custom',
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false,
  }
];

export default function ModelView() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate API call - replace with actual API call later
    const loadModels = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Combine template and custom models
        const allModels = [...mockTemplateModels, ...mockCustomModels];
        setModels(allModels);

        // Set default model as selected
        const defaultModel = allModels.find(model => model.isDefault);
        if (defaultModel) {
          setSelectedModelId(defaultModel.id);
        }
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    // You could also save this preference to localStorage or backend
    localStorage.setItem('selectedModelId', modelId);
  };

  const handleModelViewDetails = (modelId: string) => {
    // For template models, trigger download
    const model = models.find(m => m.id === modelId);
    if (model?.type === 'template' && model.fileUrl) {
      const link = document.createElement('a');
      link.href = model.fileUrl;
      link.download = 'dealq-multifamily-template-091725.xlsm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Navigate to model details page or open modal
      console.log('View details for model:', modelId);
      // router.push(`/dashboard/models/${modelId}`);
    }
  };

  const handleAddModel = () => {
    // Navigate to add model page
    router.push('/dashboard/models/add');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-8">
          {/* Loading skeleton for DealQ Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-8 h-5" />
            </div>
            <Skeleton className="w-96 h-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Loading skeleton for Custom Models */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-8 h-5" />
            </div>
            <Skeleton className="w-96 h-4" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Models</h1>
            <p className="text-slate-600 mt-2">
              Choose from our pre-built templates or use your own custom Excel models
            </p>
          </div>
          <Button onClick={handleAddModel} className="gap-2 opacity-50 cursor-not-allowed" disabled>
            <Plus className="w-4 h-4" />
            Add Custom Model
          </Button>
        </div>
      </div>

      {/* Models Grid */}
      <ModelsGrid
        models={models}
        onModelViewDetails={handleModelViewDetails}
        onAddModel={handleAddModel}
      />


    </div>
  );
}
