import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PipelineState, PipelineActions, PipelineStore } from './types';
import { createPipelineActions } from './actions';

// Initial state
const initialState: PipelineState = {
  // Metrics (static source of truth)
  metrics: null,

  // Deals Data
  deals: [],
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_previous: false,
  },

  // Filters & Sorting
  currentFilters: {},
  currentSort: { sort_by: 'updated_at', sort_order: 'desc' },
  appliedFilters: {},

  // Loading & Error States
  loading: {
    isLoading: false,
    isLoadingMetrics: false,
    isUpdatingStatus: false,
  },
  error: null,

  // Selection State (for future use)
  selectedDealIds: [],
  isAllSelected: false,
  isSelectionMode: false,
};

// Create the store
export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      ...createPipelineActions(set, get),
    }),
    {
      name: 'pipeline-store',
      // Only log actions in development
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Export store instance for direct access if needed
export const pipelineStore = usePipelineStore.getState;

// Export actions for direct access if needed
export const pipelineActions = {
  fetchPipelineMetrics: () => usePipelineStore.getState().fetchPipelineMetrics(),
  fetchDeals: (page?: number) => usePipelineStore.getState().fetchDeals(page),
  setFilters: (filters: Partial<PipelineState['currentFilters']>) =>
    usePipelineStore.getState().setFilters(filters),
  setSort: (sort: Partial<PipelineState['currentSort']>) =>
    usePipelineStore.getState().setSort(sort),
  applyFilters: () => usePipelineStore.getState().applyFilters(),
  resetFilters: () => usePipelineStore.getState().resetFilters(),
  setPage: (page: number) => usePipelineStore.getState().setPage(page),
  toggleSelection: (dealId: string) => usePipelineStore.getState().toggleSelection(dealId),
  selectAll: () => usePipelineStore.getState().selectAll(),
  clearSelection: () => usePipelineStore.getState().clearSelection(),
  bulkDeleteDeals: (dealIds: string[]) => usePipelineStore.getState().bulkDeleteDeals(dealIds),
  bulkUpdateStatus: (dealIds: string[], newStatus: 'active' | 'draft' | 'dead') => usePipelineStore.getState().bulkUpdateStatus(dealIds, newStatus),
  clearError: () => usePipelineStore.getState().clearError(),
};
