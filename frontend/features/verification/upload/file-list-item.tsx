"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, X, BarChart3, File } from 'lucide-react';
import FileTypeDropdown, { DocumentType } from './file-type-dropdown';

interface FileListItemProps {
  file: File;
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  onRemove: () => void;
  disabled?: boolean;
  isDuplicate?: boolean;
}

export default function FileListItem({
  file,
  documentType,
  onDocumentTypeChange,
  onRemove,
  disabled = false,
  isDuplicate = false
}: FileListItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <BarChart3 className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-blue-500" />;
  };

  const getDocumentTypeBadge = (type: DocumentType) => {
    if (!type) return null;

    const variants = {
      'T12': 'default' as const,
      'RR': 'secondary' as const,
      'OM': 'outline' as const,
    };

    return (
      <Badge variant={variants[type]} className="text-xs">
        {type}
      </Badge>
    );
  };

  return (
    <Card className={`transition-all duration-200 ${
      isDuplicate ? 'border-destructive/50 bg-destructive/5' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* File Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getFileIcon(file.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </h4>
                {getDocumentTypeBadge(documentType)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FileTypeDropdown
              value={documentType}
              onValueChange={onDocumentTypeChange}
              disabled={disabled}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Duplicate Warning */}
        {isDuplicate && (
          <div className="mt-2 p-2 bg-white rounded-md">
            <p className="text-xs text-foreground">
              ⚠️ This document type is already selected. Please choose a different type.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
