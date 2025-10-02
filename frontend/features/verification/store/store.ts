import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { VerificationStore, initialState } from './types';
import { createVerificationActions } from './actions';

// Create the store
export const useVerificationStore = create<VerificationStore>()(
  subscribeWithSelector(
    persist(
      (set: any, get: any) => ({
        ...initialState,
        ...createVerificationActions(set, get),
      }),
      {
        name: 'verification-store',
        partialize: (state) => ({
          dealResponse: state.dealResponse,
          currentDealId: state.currentDealId,
          propertyDetails: state.propertyDetails,
          t12Data: state.t12Data,
          rentRollData: state.rentRollData,
          computedFinancials: state.computedFinancials,
          activeTab: state.activeTab,
          lastSaved: state.lastSaved,
          hasUnsavedChanges: state.hasUnsavedChanges, // Persist unsaved changes
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Rehydrate with proper typing
            state.isLoading = false;
            // Don't reset hasUnsavedChanges - let it persist across rehydration
            // state.hasUnsavedChanges = false;
            state.error = null;
          }
        },
      }
    )
  )
);
