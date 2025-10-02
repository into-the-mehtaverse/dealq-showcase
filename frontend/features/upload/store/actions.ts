import { useUploadStore } from './store';
import { UploadedFile } from './types';

// Action creators for common operations
export const uploadActions = {
    // Add files from drag & drop or file picker
  addFiles: (files: File[], documentTypes?: ('T12' | 'RR' | 'OM')[]) => {
    const store = useUploadStore.getState();

    const uploadedFiles: UploadedFile[] = files.map((file, index) => ({
      id: generateFileId(),
      file,
      documentType: documentTypes?.[index] || null,
    }));

    store.addPendingFiles(uploadedFiles);
  },

  // Add a single file
  addFile: (file: File, documentType?: 'T12' | 'RR' | 'OM') => {
    const store = useUploadStore.getState();

    const uploadedFile: UploadedFile = {
      id: generateFileId(),
      file,
      documentType: documentType || null,
    };

    store.addPendingFiles([uploadedFile]);
  },

  // Remove multiple files by IDs
  removeFiles: (fileIds: string[]) => {
    const store = useUploadStore.getState();

    fileIds.forEach((fileId) => {
      store.removePendingFile(fileId);
    });
  },

    // Update document types for multiple files
  updateDocumentTypes: (updates: { fileId: string; documentType: 'T12' | 'RR' | 'OM' }[]) => {
    const store = useUploadStore.getState();

    updates.forEach(({ fileId, documentType }) => {
      store.updateFileDocumentType(fileId, documentType);
    });
  },

  // Validate files before submission
  validateFiles: () => {
    const store = useUploadStore.getState();
    const { pendingFiles } = store;

    if (pendingFiles.length === 0) {
      return { isValid: false, error: 'Please upload at least one file' };
    }

    const unassignedFiles = pendingFiles.filter(f => !f.documentType);
    if (unassignedFiles.length > 0) {
      return { isValid: false, error: 'Please assign document types to all files' };
    }

    const assignedTypes = pendingFiles.map(f => f.documentType).filter(Boolean);
    const duplicateTypes = assignedTypes.filter((type, index) => assignedTypes.indexOf(type) !== index);
    if (duplicateTypes.length > 0) {
      return { isValid: false, error: 'Each document type can only be used once' };
    }

    return { isValid: true, error: null };
  },

  // Prepare files for API submission
  prepareFilesForSubmission: () => {
    const store = useUploadStore.getState();
    const { pendingFiles } = store;

    return pendingFiles.map(f => ({
      document_type: f.documentType!,
      file_type: f.file.type === 'application/pdf' ? 'pdf' : 'excel',
      original_filename: f.file.name,
      file: f.file,
    }));
  },

  // Clear all data and reset to initial state
  clearAll: () => {
    const store = useUploadStore.getState();
    store.reset();
  },
};

// Utility function to generate unique file IDs
function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export individual actions for convenience
export const {
  addFiles,
  addFile,
  removeFiles,
  updateDocumentTypes,
  validateFiles,
  prepareFilesForSubmission,
  clearAll,
} = uploadActions;
