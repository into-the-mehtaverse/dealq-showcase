import { APIUploadResponse } from '@/types/api/uploadNew';
import { VerificationState, VerificationActions, PropertyDetails, VerificationTab } from './types';
import { T12CalculationService, T12DataItem } from '../t-12-service';

// Helper function to extract property details from deal response
export const extractPropertyDetails = (response: APIUploadResponse): PropertyDetails => {
  const propertyInfo = response.property_info || {};
  const classificationResult = response.classification_result;

  return {
    property_name: propertyInfo.property_name || classificationResult?.property_name?.value,
    address: propertyInfo.address || classificationResult?.address?.value,
    city: propertyInfo.city || classificationResult?.city?.value,
    state: propertyInfo.state || classificationResult?.state?.value,
    zip_code: propertyInfo.zip_code || classificationResult?.zip_code?.value,
    number_of_units: propertyInfo.number_of_units || classificationResult?.number_of_units?.value,
    year_built: propertyInfo.year_built || classificationResult?.year_built?.value,
    parking_spaces: propertyInfo.parking_spaces || classificationResult?.parking_spaces?.value,
    gross_square_feet: propertyInfo.gross_square_feet || classificationResult?.gross_square_feet?.value,
    asking_price: propertyInfo.asking_price || classificationResult?.asking_price?.value,
    description: propertyInfo.description || '',
    market_description: propertyInfo.market_description || '',
  };
};

// Helper function to recalculate financials from T12 data
const recalculateFinancialsFromData = (t12Data: Array<Record<string, unknown>>): any => {
  console.log('🔍 Store: recalculateFinancialsFromData called with:', t12Data);

  // Convert to T12DataItem format for the service
  const formattedData: T12DataItem[] = t12Data.map(item => ({
    category: item.category as string,
    total: item.total as number,
    line_item: item.line_item as string,
    ...item
  }));

  console.log('🔍 Store: Formatted data for service:', formattedData);

  // Validate data before calculation
  const validation = T12CalculationService.validateData(formattedData);
  if (!validation.isValid) {
    console.warn('T12 data validation failed:', validation.errors);
    return null;
  }

  // Calculate all financial metrics
  const result = T12CalculationService.calculateAll(formattedData);

  console.log('🔍 Store: Service calculation result:', result);

  return result;
};

// Create actions factory
export const createVerificationActions = (set: any, get: any): VerificationActions => ({
  // Core actions
  setDealResponse: (response: APIUploadResponse) => {
    set({
      dealResponse: response,
      currentDealId: response.deal_id,
      hasUnsavedChanges: false,
      lastSaved: null,
      error: null,
    });
  },

  setCurrentDealId: (dealId: string) => {
    set({ currentDealId: dealId });
  },

  // Property details actions
  updatePropertyDetails: (details: Partial<PropertyDetails>) => {
    set((state: VerificationState) => ({
      propertyDetails: { ...state.propertyDetails, ...details },
      hasUnsavedChanges: true,
    }));
  },

  resetPropertyDetails: () => {
    const { dealResponse } = get();
    if (dealResponse) {
      const extractedDetails = extractPropertyDetails(dealResponse);
      set({
        propertyDetails: extractedDetails,
        hasUnsavedChanges: false,
      });
    }
  },

  // T12 data actions
  updateT12Data: (data: Array<Record<string, unknown>>) => {
    set((state: VerificationState) => {
      const newState: Partial<VerificationState> = {
        t12Data: data,
        hasUnsavedChanges: true,
      };

      // Recalculate financials when T12 data changes
      const financials = recalculateFinancialsFromData(data);
      if (financials) {
        newState.computedFinancials = financials;
      }

      return newState;
    });
  },

  updateT12Row: (index: number, rowData: Record<string, unknown>) => {
    set((state: VerificationState) => {
      const newT12Data = [...state.t12Data];
      newT12Data[index] = { ...newT12Data[index], ...rowData };

      const newState: Partial<VerificationState> = {
        t12Data: newT12Data,
        hasUnsavedChanges: true,
      };

      // Recalculate financials when T12 data changes
      const financials = recalculateFinancialsFromData(newT12Data);
      if (financials) {
        newState.computedFinancials = financials;
      }

      return newState;
    });
  },

  addT12Row: (rowData: Record<string, unknown>) => {
    set((state: VerificationState) => {
      const newT12Data = [...state.t12Data, rowData];

      const newState: Partial<VerificationState> = {
        t12Data: newT12Data,
        hasUnsavedChanges: true,
      };

      // Recalculate financials when T12 data changes
      const financials = recalculateFinancialsFromData(newT12Data);
      if (financials) {
        newState.computedFinancials = financials;
      }

      return newState;
    });
  },

  removeT12Row: (index: number) => {
    set((state: VerificationState) => {
      const newT12Data = state.t12Data.filter((_: Record<string, unknown>, i: number) => i !== index);

      const newState: Partial<VerificationState> = {
        t12Data: newT12Data,
        hasUnsavedChanges: true,
      };

      // Recalculate financials when T12 data changes
      const financials = recalculateFinancialsFromData(newT12Data);
      if (financials) {
        newState.computedFinancials = financials;
      }

      return newState;
    });
  },

  resetT12Data: () => {
    const { dealResponse } = get();
    if (dealResponse?.structured_t12) {
      set((state: VerificationState) => {
        const newState: Partial<VerificationState> = {
          t12Data: dealResponse.structured_t12,
          hasUnsavedChanges: false,
        };

        // Recalculate financials when T12 data changes
        const financials = recalculateFinancialsFromData(dealResponse.structured_t12);
        if (financials) {
          newState.computedFinancials = financials;
        }

        return newState;
      });
    }
  },

  // Computed financials actions
  recalculateFinancials: () => {
    const { t12Data } = get();
    const financials = recalculateFinancialsFromData(t12Data);
    if (financials) {
      set({ computedFinancials: financials });
    }
  },

  setComputedFinancials: (financials: any) => {
    set({ computedFinancials: financials });
  },

  clearComputedFinancials: () => {
    set({ computedFinancials: null });
  },

  // Rent roll data actions
  updateRentRollData: (data: Array<Record<string, unknown>>) => {
    set({
      rentRollData: data,
      hasUnsavedChanges: true,
    });
  },

  updateRentRollRow: (index: number, rowData: Record<string, unknown>) => {
    set((state: VerificationState) => {
      const newRentRollData = [...state.rentRollData];
      newRentRollData[index] = { ...newRentRollData[index], ...rowData };
      return {
        rentRollData: newRentRollData,
        hasUnsavedChanges: true,
      };
    });
  },

  addRentRollRow: (rowData: Record<string, unknown>) => {
    set((state: VerificationState) => ({
      rentRollData: [...state.rentRollData, rowData],
      hasUnsavedChanges: true,
    }));
  },

  removeRentRollRow: (index: number) => {
    set((state: VerificationState) => ({
      rentRollData: state.rentRollData.filter((_: Record<string, unknown>, i: number) => i !== index),
      hasUnsavedChanges: true,
    }));
  },

  resetRentRollData: () => {
    const { dealResponse } = get();
    if (dealResponse?.structured_rent_roll) {
      set({
        rentRollData: dealResponse.structured_rent_roll,
        hasUnsavedChanges: false,
      });
    }
  },

  // UI state actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setActiveTab: (tab: VerificationTab) => {
    set({ activeTab: tab });
  },

  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  setLastSaved: (date: Date) => {
    set({ lastSaved: date });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Sidebar actions
  setRightSidebarOpen: (open: boolean) => {
    set({ rightSidebarOpen: open });
  },

  setSelectedDocumentType: (type: 'T12' | 'RR' | null) => {
    set({ selectedDocumentType: type });
  },

  // Utility actions
  resetStore: () => {
    set({
      dealResponse: null,
      currentDealId: null,
      propertyDetails: {},
      t12Data: [],
      rentRollData: [],
      isLoading: false,
      activeTab: 'property',
      hasUnsavedChanges: false,
      lastSaved: null,
      error: null,
    });
  },

  markAsChanged: () => {
    set({ hasUnsavedChanges: true });
  },

  clearChanges: () => {
    set({ hasUnsavedChanges: false });
  },

  initializeFromDealResponse: (response: APIUploadResponse) => {
    const propertyDetails = extractPropertyDetails(response);

    // Calculate initial financials if T12 data exists
    let computedFinancials = null;
    if (response.structured_t12) {
      computedFinancials = recalculateFinancialsFromData(response.structured_t12);
    }

    set({
      dealResponse: response,
      currentDealId: response.deal_id,
      propertyDetails,
      t12Data: response.structured_t12 || [],
      rentRollData: response.structured_rent_roll || [],
      computedFinancials,
      hasUnsavedChanges: false,
      lastSaved: null,
      error: null,
    });
  },
});
