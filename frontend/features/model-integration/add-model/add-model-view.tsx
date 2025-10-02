"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import ModelForm from './model-form';
import { Model } from '../types';

interface AddModelViewProps {
  className?: string;
}

export default function AddModelView({ className = "" }: AddModelViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call to register the model
      console.log('Submitting model:', formData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Handle actual model registration
      // const response = await registerModel(formData);

      // For now, just log success and redirect
      console.log('Model registered successfully');

      // Redirect back to models list
      router.push('/dashboard/models');
    } catch (error) {
      console.error('Error registering model:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/models');
  };

  return (
    <div className={`container mx-auto p-6 ${className}`}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Models
          </Button>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-slate-900">Add Custom Model</h1>
          <p className="text-slate-600 mt-2">
            Register your Excel model to use it for data processing and output generation
          </p>
        </div>
      </div>

      {/* Model Form */}
      <ModelForm onSubmit={handleSubmit} />

      {/* Additional Information */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your Excel file will be analyzed to understand its structure</li>
            <li>• We'll create a mapping configuration for data processing</li>
            <li>• Your model will be available for selection during underwriting</li>
            <li>• You can choose to use your model instead of our default templates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
