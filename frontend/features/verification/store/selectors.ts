import { useVerificationStore } from './store';
import { PropertyDetails, VerificationState } from './types';

// Core data selectors
export const useVerificationSelectors = {
  // Core data selectors
  useDealResponse: () => useVerificationStore((state: VerificationState) => state.dealResponse),
  useCurrentDealId: () => useVerificationStore((state: VerificationState) => state.currentDealId),

    // Property details selectors
  usePropertyDetails: () => useVerificationStore((state: VerificationState) => state.propertyDetails),
  usePropertyField: (field: keyof PropertyDetails) =>
    useVerificationStore((state: VerificationState) => state.propertyDetails[field]),

  // T12 data selectors
  useT12Data: () => useVerificationStore((state: VerificationState) => state.t12Data),
  useT12Row: (index: number) =>
    useVerificationStore((state: VerificationState) => state.t12Data[index]),

  // Computed financials selectors
  useComputedFinancials: () => useVerificationStore((state: VerificationState) => state.computedFinancials),
  useTotalRevenue: () => useVerificationStore((state: VerificationState) => state.computedFinancials?.totalRevenue ?? 0),
  useTotalDeductions: () => useVerificationStore((state: VerificationState) => state.computedFinancials?.totalDeductions ?? 0),
  useTotalExpenses: () => useVerificationStore((state: VerificationState) => state.computedFinancials?.totalExpenses ?? 0),
  useGrossIncome: () => useVerificationStore((state: VerificationState) => state.computedFinancials?.grossIncome ?? 0),
  useNOI: () => useVerificationStore((state: VerificationState) => state.computedFinancials?.noi ?? 0),

  // Rent roll data selectors
  useRentRollData: () => useVerificationStore((state: VerificationState) => state.rentRollData),
  useRentRollRow: (index: number) =>
    useVerificationStore((state: VerificationState) => state.rentRollData[index]),

  // UI state selectors
  useIsLoading: () => useVerificationStore((state: VerificationState) => state.isLoading),
  useActiveTab: () => useVerificationStore((state: VerificationState) => state.activeTab),
  useHasUnsavedChanges: () => useVerificationStore((state: VerificationState) => state.hasUnsavedChanges),
  useLastSaved: () => useVerificationStore((state: VerificationState) => state.lastSaved),
  useError: () => useVerificationStore((state: VerificationState) => state.error),

  // Sidebar state selectors
  useRightSidebarOpen: () => useVerificationStore((state: VerificationState) => state.rightSidebarOpen),
  useSelectedDocumentType: () => useVerificationStore((state: VerificationState) => state.selectedDocumentType),

  // Computed selectors
  useHasDealData: () => useVerificationStore((state: VerificationState) => !!state.dealResponse),
  useIsPropertyTab: () => useVerificationStore((state: VerificationState) => state.activeTab === 'property'),
  useIsT12Tab: () => useVerificationStore((state: VerificationState) => state.activeTab === 't12'),
  useIsRentRollTab: () => useVerificationStore((state: VerificationState) => state.activeTab === 'rent-roll'),
  useHasT12Data: () => useVerificationStore((state: VerificationState) => state.t12Data.length > 0),
  useHasRentRollData: () => useVerificationStore((state: VerificationState) => state.rentRollData.length > 0),

    // Advanced computed selectors
  usePropertyDetailsCount: () => useVerificationStore((state: VerificationState) => {
    const details = state.propertyDetails;
    return Object.values(details).filter(value => value !== undefined && value !== '').length;
  }),

  useT12DataCount: () => useVerificationStore((state: VerificationState) => state.t12Data.length),
  useRentRollDataCount: () => useVerificationStore((state: VerificationState) => state.rentRollData.length),

  useHasPropertyDetails: () => useVerificationStore((state: VerificationState) => {
    const details = state.propertyDetails;
    return Object.values(details).some(value => value !== undefined && value !== '');
  }),

  useIsDataComplete: () => useVerificationStore((state: VerificationState) => {
    const hasPropertyDetails = Object.values(state.propertyDetails).some(value => value !== undefined && value !== '');
    const hasT12Data = state.t12Data.length > 0;
    const hasRentRollData = state.rentRollData.length > 0;

    return hasPropertyDetails && hasT12Data && hasRentRollData;
  }),

  useCompletionPercentage: () => useVerificationStore((state: VerificationState) => {
    let completed = 0;
    let total = 0;

    // Property details
    const propertyFields = Object.values(state.propertyDetails);
    total += propertyFields.length;
    completed += propertyFields.filter(value => value !== undefined && value !== '').length;

    // T12 data
    total += 1;
    if (state.t12Data.length > 0) completed += 1;

    // Rent roll data
    total += 1;
    if (state.rentRollData.length > 0) completed += 1;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }),
};

// Export actions for direct use
export const useVerificationActions = () => {
  const store = useVerificationStore();
  return {
    setDealResponse: store.setDealResponse,
    setCurrentDealId: store.setCurrentDealId,
    updatePropertyDetails: store.updatePropertyDetails,
    resetPropertyDetails: store.resetPropertyDetails,
    updateT12Data: store.updateT12Data,
    updateT12Row: store.updateT12Row,
    addT12Row: store.addT12Row,
    removeT12Row: store.removeT12Row,
    resetT12Data: store.resetT12Data,
    recalculateFinancials: store.recalculateFinancials,
    setComputedFinancials: store.setComputedFinancials,
    clearComputedFinancials: store.clearComputedFinancials,
    updateRentRollData: store.updateRentRollData,
    updateRentRollRow: store.updateRentRollRow,
    addRentRollRow: store.addRentRollRow,
    removeRentRollRow: store.removeRentRollRow,
    resetRentRollData: store.resetRentRollData,
    setLoading: store.setLoading,
    setActiveTab: store.setActiveTab,
    setHasUnsavedChanges: store.setHasUnsavedChanges,
    setLastSaved: store.setLastSaved,
    setError: store.setError,
    setRightSidebarOpen: store.setRightSidebarOpen,
    setSelectedDocumentType: store.setSelectedDocumentType,
    resetStore: store.resetStore,
    markAsChanged: store.markAsChanged,
    clearChanges: store.clearChanges,
    initializeFromDealResponse: store.initializeFromDealResponse,
  };
};
