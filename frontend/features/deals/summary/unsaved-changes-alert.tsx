import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useDealSelectors } from './store';

interface UnsavedChangesAlertProps {
  className?: string;
}

export default function UnsavedChangesAlert({ className = '' }: UnsavedChangesAlertProps) {
  const hasUnsavedChanges = useDealSelectors.useHasUnsavedChanges();

  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto ml-10 ${className}`}>
      <Alert className="border-amber-200 bg-amber-50 text-amber-800 shadow-lg flex items-center justify-center gap-2 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="font-medium">Unsaved Changes</span>
      </Alert>
    </div>
  );
}
