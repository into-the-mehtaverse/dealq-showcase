import { create } from 'zustand';
import { DealStore, initialState } from './types';
import { createDealActions } from './actions';

// Create the store
export const useDealStore = create<DealStore>()((set: any, get: any) => ({
  ...initialState,
  ...createDealActions(set, get),
}));
