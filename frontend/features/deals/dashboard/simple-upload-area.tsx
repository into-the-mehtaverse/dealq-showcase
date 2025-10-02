"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Plus } from 'lucide-react';
import { uploadActions } from '@/features/upload/store/actions';

interface SimpleUploadAreaProps {
  className?: string;
}

export default function SimpleUploadArea({ className = "" }: SimpleUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = ['.pdf', '.xls', '.xlsx'].some(type =>
        file.name.toLowerCase().endsWith(type.toLowerCase())
      );
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      // Add files to the store
      uploadActions.addFiles(validFiles);

      // Redirect to upload page
      router.push('/upload');
    }
  }, [router]);

  return (
    <Card className={`transition-all duration-200 cursor-pointer${
      isDragOver
        ? 'border-primary bg-primary/5 scale-[1.02]'
        : 'border-dashed border-muted-foreground/20 hover:border-primary/50'
    } ${className}`}>
      <CardContent className="p-6">
        <div
          className="flex flex-col items-center justify-center text-center min-h-[120px]"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
            isDragOver
              ? 'bg-primary/20 text-primary'
              : 'bg-primary/10 text-primary'
          }`}>
            {isDragOver ? (
              <Upload className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-base font-medium text-foreground mb-2">
            {isDragOver ? 'Drop files here' : 'Quick Upload'}
          </h3>

          <p className="text-sm text-muted-foreground">
            {isDragOver
              ? 'Release to upload your files'
              : 'Drag and drop files to start uploading'
            }
          </p>

          <p className="text-xs text-muted-foreground mt-3">
            Supported: .pdf, .xls, .xlsx • Max: 50MB per file
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
