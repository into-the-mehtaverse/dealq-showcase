"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileUploadArea from "./file-upload-area";
import FileList from "./file-list";
import ProcessLoading from "./process-loading";
import { requestUpload } from "@/lib/api/actions/requestUpload";
import { uploadToStorage } from "@/lib/api/actions/uploadToStorage";
import { confirmUpload } from "@/lib/api/actions/confirmUpload";
import type { APIUploadResponse } from "@/types/api/uploadNew";
import { useVerificationStore } from "@/features/verification/store";
import { useJobPolling } from "@/features/verification/hooks/usePolling";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DocumentType } from "./file-type-dropdown";
import { AlertCircle, X, Upload } from "lucide-react";
import { useUploadStore } from "@/features/upload/store/store";
import { uploadActions } from "@/features/upload/store/actions";

// Import the UploadedFile type from the store
import type { UploadedFile } from "@/features/upload/store/types";

interface UploadDocsProps {
  onSubmit?: (files: UploadedFile[], dealData?: APIUploadResponse) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export default function UploadDocs({
  onSubmit,
  maxFileSize = 50,
  acceptedTypes = ['.pdf', '.xls', '.xlsx'],
  className = ""
}: UploadDocsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Use the upload store instead of local state
  const {
    pendingFiles: files,
    error,
    setError,
    setUploading,
    clearPendingFiles
  } = useUploadStore();

  // Use the job polling hook
  const {
    isPolling,
    jobStatus,
    currentStep,
    error: pollingError,
    startPolling,
    stopPolling,
    isComplete,
    isSuccess,
    isFailed,
    progressPercentage,
    setCurrentStep,
    setProgressPercentage
  } = useJobPolling({
    onSuccess: (dealId) => {
      console.log('🔍 Job completed successfully for deal:', dealId);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    }
  });



  // Handle adding new files
  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const existingFileNames = files.map(f => f.file.name);
    const validNewFiles = newFiles.filter(file => !existingFileNames.includes(file.name));

    if (files.length + validNewFiles.length > 3) {
      setError('Maximum 3 files allowed. Please remove some files first.');
      return;
    }

    // Use store action to add files
    uploadActions.addFiles(validNewFiles);
    setError(null);
  }, [files, setError]);

  // Handle removing a file
  const handleFileRemove = useCallback((fileId: string) => {
    uploadActions.removeFiles([fileId]);
    setError(null);
  }, [setError]);

  // Handle document type change
  const handleDocumentTypeChange = useCallback((fileId: string, documentType: DocumentType) => {
    if (documentType) {
      uploadActions.updateDocumentTypes([{ fileId, documentType }]);
    }
    setError(null);
  }, [setError]);

  // Get store actions
  const { resetStore } = useVerificationStore();



  // Handle submit with new async flow
  const handleSubmit = useCallback(async () => {
    // Use store validation
    const validation = uploadActions.validateFiles();
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Set initial progress state for the loading component
    setCurrentStep('Uploading documents...');
    setProgressPercentage(15);
    setUploading(true);

    try {
      // Clean up any existing store data before starting new upload
      resetStore();

      // Step 1: Request upload and get presigned URLs
      const fileMetadata = uploadActions.prepareFilesForSubmission();

      const uploadResponse = await requestUpload(fileMetadata);
      console.log('Upload response received:', uploadResponse);

      // Step 2: Upload files to storage using presigned URLs
      const uploadResult = await uploadToStorage(
        fileMetadata.map(f => f.file), // Extract File objects from prepared metadata
        uploadResponse.upload_info
      );

      if (!uploadResult.success) {
        throw new Error(`File upload failed: ${uploadResult.errors?.join(', ')}`);
      }

      console.log('Files uploaded successfully:', uploadResult.uploadedFiles);

      // Step 3: Confirm uploads and trigger background processing
      const confirmResult = await confirmUpload({
        upload_id: uploadResponse.upload_id,
        deal_id: uploadResponse.deal_id,
        uploaded_successfully: true
      });

      console.log('Upload confirmed and processing started:', confirmResult);

      // Clear the store since files are no longer needed
      clearPendingFiles();

      // Start polling for job status using the hook
      if (confirmResult.job_id) {
        startPolling(confirmResult.job_id);
      }

    } catch (error) {
      console.error('Error in new upload flow:', error);
      const errorMessage = error instanceof Error ? error.message : 'There was an error in the upload process. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  }, [onSubmit, router, resetStore, startPolling, setCurrentStep, setProgressPercentage, setUploading]);


  return (
    <div className={`space-y-8 ${className}`}>
      {/* Show loading state when polling */}
      {isSubmitting || isPolling || isComplete ? (
        <ProcessLoading
          currentStage={currentStep || "Processing Documents"}
          percentage={progressPercentage || 0}
        />
      ) : (
        <>
          {/* Upload Area */}
          <FileUploadArea
            onFilesAdded={handleFilesAdded}
            disabled={isSubmitting || isPolling}
            acceptedTypes={acceptedTypes}
            maxFileSize={maxFileSize}
          />

          {/* File List */}
          <FileList
            files={files}
            onFileRemove={handleFileRemove}
            onDocumentTypeChange={handleDocumentTypeChange}
            disabled={isSubmitting || isPolling}
          />

          {/* Submit Button */}
          {files.length > 0 && !isPolling && (
            <>
              <Separator />
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || files.length === 0 || files.some(f => !f.documentType) || files.length > 3}
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Error Display */}
      {(error || pollingError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error || pollingError}</span>
            <button
              onClick={() => {
                setError(null);
                // Note: pollingError is managed by the hook
              }}
              className="inline-flex rounded-md p-1.5 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
