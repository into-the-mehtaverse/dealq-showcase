import { useUploadStore } from './store';
import { useMemo } from 'react';

// Basic selectors
export const usePendingFiles = () => useUploadStore((state) => state.pendingFiles);
export const useIsUploading = () => useUploadStore((state) => state.isUploading);
export const useUploadError = () => useUploadStore((state) => state.error);

// Computed selectors
export const usePendingFilesCount = () => useUploadStore((state) => state.pendingFiles.length);

export const useFilesWithDocumentTypes = () => useUploadStore((state) =>
  state.pendingFiles.filter((file) => file.documentType !== null)
);

export const useFilesWithoutDocumentTypes = () => useUploadStore((state) =>
  state.pendingFiles.filter((file) => file.documentType === null)
);

export const useCanSubmit = () => useUploadStore((state) => {
  const hasFiles = state.pendingFiles.length > 0;
  const allFilesHaveTypes = state.pendingFiles.every((file) => file.documentType !== null);
  const noDuplicateTypes = (() => {
    const types = state.pendingFiles.map((f) => f.documentType).filter(Boolean);
    return types.length === new Set(types).size;
  })();

  return hasFiles && allFilesHaveTypes && noDuplicateTypes;
});

// Memoized selectors for performance
export const useFileById = (fileId: string) => {
  return useUploadStore(
    useMemo(() => (state) => state.pendingFiles.find((file) => file.id === fileId), [fileId])
  );
};

export const useFilesByDocumentType = (documentType: string) => {
  return useUploadStore(
    useMemo(() => (state) => state.pendingFiles.filter((file) => file.documentType === documentType), [documentType])
  );
};
