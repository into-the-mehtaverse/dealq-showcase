"use client";

import { useState, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import FileListItem from './file-list-item';
import { DocumentType } from './file-type-dropdown';

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
}

interface FileListProps {
  files: UploadedFile[];
  onFileRemove: (fileId: string) => void;
  onDocumentTypeChange: (fileId: string, type: DocumentType) => void;
  disabled?: boolean;
}

export default function FileList({
  files,
  onFileRemove,
  onDocumentTypeChange,
  disabled = false
}: FileListProps) {
  const getDuplicateTypes = useCallback(() => {
    const types = files.map(f => f.documentType).filter(Boolean) as DocumentType[];
    const duplicates = types.filter((type, index) => types.indexOf(type) !== index);
    return duplicates;
  }, [files]);

  const isDuplicate = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file?.documentType) return false;

    const duplicateTypes = getDuplicateTypes();
    return duplicateTypes.includes(file.documentType);
  }, [files, getDuplicateTypes]);

  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push('Please upload at least one file');
    }

    if (files.length > 3) {
      errors.push('Maximum 3 files allowed');
    }

    const duplicateTypes = getDuplicateTypes();
    if (duplicateTypes.length > 0) {
      errors.push(`Duplicate document types: ${duplicateTypes.join(', ')}`);
    }

    const unassignedFiles = files.filter(f => !f.documentType);
    if (unassignedFiles.length > 0) {
      errors.push(`${unassignedFiles.length} file(s) need document type assignment`);
    }

    return errors;
  }, [files, getDuplicateTypes]);

  const errors = getValidationErrors();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Uploaded Files ({files.length}/3)
        </h3>
        {errors.length > 0 && (
          <div className="text-sm text-foreground">
            {errors.length} issue{errors.length > 1 ? 's' : ''} to resolve
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file.file}
            documentType={file.documentType}
            onDocumentTypeChange={(type) => onDocumentTypeChange(file.id, type)}
            onRemove={() => onFileRemove(file.id)}
            disabled={disabled}
            isDuplicate={isDuplicate(file.id)}
          />
        ))}
      </div>

      {/* Validation Summary */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-white ounded-md">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Please resolve the following issues:
          </h4>
          <ul className="text-xs text-foreground space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
