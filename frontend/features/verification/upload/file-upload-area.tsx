"use client";

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Plus } from 'lucide-react';

interface FileUploadAreaProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number;
}

export default function FileUploadArea({
  onFilesAdded,
  disabled = false,
  acceptedTypes = ['.pdf', '.xls', '.xlsx'],
  maxFileSize = 50
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = acceptedTypes.some(type =>
        file.name.toLowerCase().endsWith(type.toLowerCase())
      );
      const isValidSize = file.size <= maxFileSize * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  }, [disabled, acceptedTypes, maxFileSize, onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesAdded(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesAdded]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className={`transition-all duration-200 ${
      isDragOver
        ? 'border-primary bg-primary/5 scale-[1.02]'
        : 'border-dashed border-muted-foreground/20 hover:border-primary/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <CardContent className="p-8">
        <div
          className="flex flex-col items-center justify-center text-center min-h-[200px]"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isDragOver
              ? 'bg-primary/20 text-primary'
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            {isDragOver ? (
              <Upload className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isDragOver ? 'Drop files here' : 'Upload Documents'}
          </h3>

          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {isDragOver
              ? 'Release to upload your files'
              : 'Drag and drop your files here, or click to browse'
            }
          </p>

          <Button
            onClick={handleBrowseClick}
            disabled={disabled}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Browse Files
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Supported: {acceptedTypes.join(', ')} • Max: {maxFileSize}MB per file
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
