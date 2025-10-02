import { create } from 'zustand';
import { UploadStoreState } from './types';

const initialState = {
  pendingFiles: [],
  isUploading: false,
  error: null,
};

export const useUploadStore = create<UploadStoreState>((set, get) => ({
  ...initialState,

  addPendingFiles: (files) => {
    set((state) => ({
      pendingFiles: [...state.pendingFiles, ...files],
      error: null, // Clear any previous errors when adding files
    }));
  },

  removePendingFile: (fileId) => {
    set((state) => ({
      pendingFiles: state.pendingFiles.filter((file) => file.id !== fileId),
    }));
  },

  updateFileDocumentType: (fileId, documentType) => {
    set((state) => ({
      pendingFiles: state.pendingFiles.map((file) =>
        file.id === fileId ? { ...file, documentType } : file
      ),
    }));
  },

  clearPendingFiles: () => {
    set({ pendingFiles: [] });
  },

  setUploading: (isUploading) => {
    set({ isUploading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set(initialState);
  },
}));
