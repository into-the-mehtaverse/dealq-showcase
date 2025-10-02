"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import FileUpload from './file-upload';
import { Model } from '../types';

interface ModelFormData {
  name: string;
  description: string;
  category: string;
  file: File | null;
}

interface ModelFormErrors {
  name?: string;
  description?: string;
  category?: string;
  file?: string;
}

interface ModelFormProps {
  onSubmit?: (formData: ModelFormData) => void;
  className?: string;
}

const modelCategories = [
  'Commercial Real Estate',
  'Multi-Family',
  'Office',
  'Retail',
  'Industrial',
  'Hospitality',
  'Land Development',
  'Other'
];

export default function ModelForm({
  onSubmit,
  className = ""
}: ModelFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    description: '',
    category: '',
    file: null
  });
  const [errors, setErrors] = useState<ModelFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const totalSteps = 2;

  const validateStep = (step: number): boolean => {
    const newErrors: ModelFormErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Model name is required';
      }
      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
    }

    if (step === 2) {
      if (!formData.file) {
        newErrors.file = 'Please upload an Excel file';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Call the onSubmit prop if provided
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default behavior - simulate submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Form submitted:', formData);
        // Redirect back to models list
        router.push('/dashboard/models');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof ModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (file: File) => {
    updateFormData('file', file);
  };

  const handleFileRemove = () => {
    updateFormData('file', null);
  };

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return formData.name.trim() && formData.category;
    }
    return true;
  };

  const canSubmit = () => {
    return currentStep === totalSteps && formData.file && canProceedToNext();
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Step {currentStep} of {totalSteps}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                placeholder="Enter a descriptive name for your model"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {modelCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-description">Description</Label>
              <Textarea
                id="model-description"
                placeholder="Describe your model's purpose and key features (optional)"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: File Upload */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Excel File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={formData.file}
              disabled={isSubmitting}
            />
            {errors.file && (
              <p className="text-sm text-destructive mt-2">{errors.file}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext() || isSubmitting}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Model
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Form Summary */}
      {currentStep === totalSteps && (
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-slate-900 mb-3">Model Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <span className="font-medium">{formData.category}</span>
              </div>
              {formData.description && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Description:</span>
                  <span className="font-medium max-w-[200px] truncate">
                    {formData.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">File:</span>
                <span className="font-medium">{formData.file?.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
