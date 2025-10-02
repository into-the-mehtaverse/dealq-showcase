"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
  className = ""
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptedTypes = ['.xlsx', '.xls', '.xlsm'];
  const maxFileSize = 10; // 10MB

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!acceptedTypes.includes(fileExtension)) {
      return 'Please select an Excel file (.xlsx or .xls)';
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    onFileRemove();
    setError(null);
  }, [onFileRemove]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver
          ? 'border-primary bg-primary/5'
          : selectedFile
            ? 'border-green-200 bg-green-50'
            : 'border-slate-300 hover:border-slate-400'
      }`}>
        <CardContent className="p-6">
          {!selectedFile ? (
            <div
              className={`text-center cursor-pointer transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
                             <input
                 type="file"
                 accept=".xlsx,.xls,.xlsm"
                 onChange={handleFileInputChange}
                 disabled={disabled}
                 className="hidden"
                 id="excel-file-upload"
               />
              <label htmlFor="excel-file-upload" className="cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload Excel Model
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Drag and drop your Excel file here, or click to browse
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Accepted formats: .xlsx, .xls, .xlsm</p>
                  <p>Maximum size: {maxFileSize}MB</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{selectedFile.name}</h4>
                  <p className="text-sm text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={disabled}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
