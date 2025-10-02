import { getDeal } from '@/lib/api/actions/getDeal';
import { updateDeal } from '@/lib/api/actions/updateDeal';
import { calculateUnderwriting, DEFAULT_UNDERWRITING_ASSUMPTIONS, UnderwritingAssumptions } from '@/lib/underwrite';
import { DealStoreState, DealStoreActions } from './types';
import { DealSummary } from '@/types/property';

// Create actions factory
export const createDealActions = (set: any, get: any): DealStoreActions => ({
  // Fetch deal data using getDeal action and calculate underwriting if possible
  fetchDeal: async (dealId: string) => {
    try {
      // Set loading state
      set({ isLoading: true, error: null });

      // Fetch deal data using the getDeal action
      const dealData = await getDeal(dealId);

      // Check if we have the minimum data required for underwriting
      const hasRequiredData = dealData.revenue &&
                             dealData.revenue > 0 &&
                             dealData.asking_price &&
                             dealData.asking_price > 0;

      let calculatedMetrics = null;

      if (hasRequiredData) {
        try {
          // Calculate underwriting with available data
          calculatedMetrics = calculateUnderwriting(
            dealData.revenue!, // We know revenue exists due to hasRequiredData check
            dealData.expenses || 0, // Use 0 if expenses not provided
            {
              ...DEFAULT_UNDERWRITING_ASSUMPTIONS,
              purchasePrice: dealData.asking_price!
            }
          );
        } catch (underwritingError) {
          // If underwriting calculation fails, log error but don't fail the whole request
          console.warn('Underwriting calculation failed:', underwritingError);
          // calculatedMetrics remains null, will show N/A in UI
        }
      }

      // Update store with fetched data and calculated metrics (if available)
      set({
        dealData,
        originalDealData: dealData, // Store original data for comparison
        editableFields: dealData, // Initialize editable fields with current data
        calculatedMetrics,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false, // Reset unsaved changes on new data load
      });

    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deal data';
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  // Update a specific editable field
  updateEditableField: (field: keyof DealSummary, value: any) => {
    const currentState = get();
    const updatedEditableFields = {
      ...currentState.editableFields,
      [field]: value
    };

    // Check if there are any changes compared to original data
    const hasChanges = Object.keys(updatedEditableFields).some(key => {
      const originalValue = currentState.originalDealData?.[key as keyof DealSummary];
      const currentValue = updatedEditableFields[key as keyof DealSummary];
      return originalValue !== currentValue;
    });

    set({
      editableFields: updatedEditableFields,
      hasUnsavedChanges: hasChanges
    });
  },

  // Save changes to the backend
  saveChanges: async () => {
    try {
      const currentState = get();
      const { editableFields, dealData } = currentState;

      if (!dealData?.id) {
        throw new Error('No deal ID available for saving');
      }

      // Set loading state
      set({ isLoading: true, error: null });

      // Prepare update data - only include fields that have actually changed
      const updateData: any = {};
      Object.keys(editableFields).forEach(key => {
        const fieldKey = key as keyof DealSummary;
        const originalValue = currentState.originalDealData?.[fieldKey];
        const currentValue = editableFields[fieldKey];

        if (originalValue !== currentValue) {
          updateData[fieldKey] = currentValue;
        }
      });

      // Call the updateDeal API
      const updatedDeal = await updateDeal(dealData.id, updateData);

      // Update store with new data
      set({
        dealData: updatedDeal,
        originalDealData: updatedDeal, // Update original data to new saved state
        editableFields: updatedDeal, // Reset editable fields to saved state
        hasUnsavedChanges: false, // No more unsaved changes
        isEditing: false, // Exit edit mode after successful save
        isLoading: false,
        error: null
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  // Discard all unsaved changes
  discardChanges: () => {
    const currentState = get();
    set({
      editableFields: currentState.originalDealData || {},
      hasUnsavedChanges: false
    });
  },

  // Reset to original values
  resetToOriginal: () => {
    const currentState = get();
    set({
      editableFields: currentState.originalDealData || {},
      hasUnsavedChanges: false
    });
  },

  // Mark as having changes (utility function)
  markAsChanged: () => {
    set({ hasUnsavedChanges: true });
  },

  // Set unsaved changes state
  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges });
  },

  // Start editing mode
  startEditing: () => {
    set({ isEditing: true });
  },

  // Cancel editing mode
  cancelEditing: () => {
    set({
      isEditing: false,
      hasUnsavedChanges: false,
      editableFields: get().originalDealData || {}
    });
  },

  // Recalculate underwriting with new assumptions
  recalculateUnderwriting: async (newAssumptions: UnderwritingAssumptions) => {
    try {
      const currentState = get();
      const { dealData } = currentState;

      // Check if we have the required data
      if (!dealData || !dealData.revenue || dealData.revenue <= 0 || !dealData.asking_price || dealData.asking_price <= 0) {
        throw new Error('Insufficient deal data for underwriting calculations');
      }

      // Set loading state for underwriting calculation
      set({ isLoading: true, error: null });

      // Calculate underwriting with new assumptions
      const calculatedMetrics = calculateUnderwriting(
        dealData.revenue,
        dealData.expenses || 0,
        newAssumptions
      );

      // Update store with new calculated metrics
      set({
        calculatedMetrics,
        isLoading: false,
        error: null
      });

    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to recalculate underwriting';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error; // Re-throw so the UI can handle it
    }
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
});
