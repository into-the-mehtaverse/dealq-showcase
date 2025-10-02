export interface UploadedFile {
  id: string;
  file: File;
  documentType: 'T12' | 'RR' | 'OM' | null;
}

export interface UploadStore {
  pendingFiles: UploadedFile[];
  isUploading: boolean;
  error: string | null;
}

export interface UploadStoreActions {
  addPendingFiles: (files: UploadedFile[]) => void;
  removePendingFile: (fileId: string) => void;
  updateFileDocumentType: (fileId: string, documentType: 'T12' | 'RR' | 'OM' | null) => void;
  clearPendingFiles: () => void;
  setUploading: (isUploading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type UploadStoreState = UploadStore & UploadStoreActions;
