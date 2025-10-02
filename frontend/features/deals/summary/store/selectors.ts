import { useDealStore } from './store';
import { DealStoreState } from './types';

// State selectors
export const useDealSelectors = {
  // Core data selectors
  useDealData: () => useDealStore((state: DealStoreState) => state.dealData),
  useOriginalDealData: () => useDealStore((state: DealStoreState) => state.originalDealData),
  useEditableFields: () => useDealStore((state: DealStoreState) => state.editableFields),
  useCalculatedMetrics: () => useDealStore((state: DealStoreState) => state.calculatedMetrics),

  // UI state selectors
  useIsLoading: () => useDealStore((state: DealStoreState) => state.isLoading),
  useError: () => useDealStore((state: DealStoreState) => state.error),
  useHasUnsavedChanges: () => useDealStore((state: DealStoreState) => state.hasUnsavedChanges),
  useIsEditing: () => useDealStore((state: DealStoreState) => state.isEditing),

  // Computed selectors
  useHasDealData: () => useDealStore((state: DealStoreState) => !!state.dealData),
};

// Actions selector
export const useDealActions = () => {
  const store = useDealStore();
  return {
    fetchDeal: store.fetchDeal,
    updateEditableField: store.updateEditableField,
    saveChanges: store.saveChanges,
    discardChanges: store.discardChanges,
    resetToOriginal: store.resetToOriginal,
    markAsChanged: store.markAsChanged,
    startEditing: store.startEditing,
    cancelEditing: store.cancelEditing,
    recalculateUnderwriting: store.recalculateUnderwriting,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    setHasUnsavedChanges: store.setHasUnsavedChanges,
  };
};
