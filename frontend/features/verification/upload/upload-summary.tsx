"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentType } from './file-type-dropdown';

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
}

interface UploadSummaryProps {
  files: UploadedFile[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export default function UploadSummary({
  files,
  onSubmit,
  isSubmitting = false,
  disabled = false
}: UploadSummaryProps) {
  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
  const assignedTypes = files.filter(f => f.documentType).map(f => f.documentType);
  const unassignedCount = files.filter(f => !f.documentType).length;
  const duplicateTypes = assignedTypes.filter((type, index) => assignedTypes.indexOf(type) !== index);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isValid = () => {
    return files.length > 0 &&
           files.length <= 3 &&
           unassignedCount === 0 &&
           duplicateTypes.length === 0;
  };

  const getStatusIcon = () => {
    if (isValid()) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  };

  const getStatusText = () => {
    if (files.length === 0) return 'No files uploaded';
    if (files.length > 3) return 'Too many files (max 3)';
    if (unassignedCount > 0) return `${unassignedCount} file(s) need type assignment`;
    if (duplicateTypes.length > 0) return 'Duplicate document types detected';
    return 'Ready to upload';
  };

  const getStatusColor = () => {
    if (isValid()) return 'text-green-600';
    return 'text-amber-600';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Upload Summary
              </h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            disabled={disabled || !isValid() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Documents
              </>
            )}
          </Button>
        </div>

        <Separator className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Count */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{files.length}</div>
            <div className="text-sm text-muted-foreground">Files</div>
            <div className="text-xs text-muted-foreground mt-1">
              {files.length}/3 maximum
            </div>
          </div>

          {/* Total Size */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {formatFileSize(totalSize)}
            </div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </div>

          {/* Document Types */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-lg font-semibold text-foreground">
              {assignedTypes.length}
            </div>
            <div className="text-sm text-muted-foreground">Types Assigned</div>
            {assignedTypes.length > 0 && (
              <div className="flex justify-center gap-1 mt-2">
                {assignedTypes.map((type, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File List Preview */}
        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Files:</h4>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">
                    {index + 1}. {file.file.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                    </span>
                    {file.documentType && (
                      <Badge variant="outline" className="text-xs">
                        {file.documentType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
