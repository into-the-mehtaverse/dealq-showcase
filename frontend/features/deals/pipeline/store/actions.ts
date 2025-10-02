import { getPipelineDealsWithFilters } from '@/lib/api/actions/getPipelineDealsWithFilters';
import { getPipelineMetrics } from '@/lib/api/actions/getPipelineMetrics';
import { deleteMultipleDeals } from '@/lib/api/actions/deleteDeals';
import { updateMultipleDealStatuses } from '@/lib/api/actions/updateDealStatuses';
import { PipelineState, PipelineActions, PipelineFilters, PipelineSort, PipelinePagination } from './types';

// Default values
const DEFAULT_FILTERS: PipelineFilters = {};
const DEFAULT_SORT: PipelineSort = { sort_by: 'updated_at', sort_order: 'desc' };
const DEFAULT_PAGINATION: PipelinePagination = {
  current_page: 1,
  total_pages: 1,
  total_count: 0,
  has_next: false,
  has_previous: false,
};

// Store actions implementation
export const createPipelineActions = (set: any, get: () => PipelineState): PipelineActions => ({
  // Metrics Management
  fetchPipelineMetrics: async () => {
    try {
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoadingMetrics: true },
        error: null,
      }));

      const metrics = await getPipelineMetrics();

      set((state: PipelineState) => ({
        metrics,
        loading: { ...state.loading, isLoadingMetrics: false },
      }));
    } catch (error) {
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoadingMetrics: false },
        error: { message: 'Failed to fetch pipeline metrics', code: 'METRICS_FETCH_ERROR' },
      }));
    }
  },

  // Deals Management
  fetchDeals: async (page?: number) => {
    const state = get();
    const targetPage = page ?? state.pagination.current_page;

    try {
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoading: true },
        error: null,
      }));

      // Combine current filters, sort, and status from current tab
      const requestFilters = {
        ...state.currentFilters,
        ...state.currentSort,
      };

      const response = await getPipelineDealsWithFilters(requestFilters, targetPage);

      set((state: PipelineState) => ({
        deals: response.deals,
        pagination: response.pagination,
        loading: { ...state.loading, isLoading: false },
      }));
    } catch (error) {
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoading: false },
        error: { message: 'Failed to fetch deals', code: 'DEALS_FETCH_ERROR' },
      }));
    }
  },

  // Filter Management
  setFilters: (filters: Partial<PipelineFilters>) => {
    set((state: PipelineState) => ({
      currentFilters: { ...state.currentFilters, ...filters },
      // Reset to first page when filters change
      pagination: { ...state.pagination, current_page: 1 },
    }));
  },

  setSort: (sort: Partial<PipelineSort>) => {
    set((state: PipelineState) => ({
      currentSort: { ...state.currentSort, ...sort },
      // Reset to first page when sort changes
      pagination: { ...state.pagination, current_page: 1 },
    }));
  },

  applyFilters: async () => {
    const state = get();

    // Update applied filters to match current filters
    set((state: PipelineState) => ({
      appliedFilters: { ...state.currentFilters },
    }));

    // Fetch deals with new filters
    const actions = get() as PipelineState & PipelineActions;
    await actions.fetchDeals(1);
  },

  resetFilters: () => {
    set((state: PipelineState) => ({
      currentFilters: DEFAULT_FILTERS,
      appliedFilters: DEFAULT_FILTERS,
      currentSort: DEFAULT_SORT,
      pagination: { ...state.pagination, current_page: 1 },
    }));
  },

  // Pagination Management
  setPage: async (page: number) => {
    try {
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoading: true },
        error: null,
      }));

      // Fetch deals for the new page first
      const actions = get() as PipelineState & PipelineActions;
      await actions.fetchDeals(page);

      // Note: fetchDeals already updates the pagination state from the API response
      // We don't need to manually set current_page here
    } catch (error) {
      // If fetch fails, don't update the page
      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoading: false },
        error: { message: 'Failed to fetch page', code: 'PAGE_FETCH_ERROR' },
      }));
    }
  },

  // Selection Management (for future use)
  toggleSelection: (dealId: string) => {
    set((state: PipelineState) => {
      const isSelected = state.selectedDealIds.includes(dealId);
      const newSelectedIds = isSelected
        ? state.selectedDealIds.filter(id => id !== dealId)
        : [...state.selectedDealIds, dealId];

      return {
        selectedDealIds: newSelectedIds,
        isAllSelected: newSelectedIds.length === state.deals.length && state.deals.length > 0,
      };
    });
  },

  toggleSelectionMode: () => {
    set((state: PipelineState) => ({
      isSelectionMode: !state.isSelectionMode,
      // Clear selection when exiting selection mode (when currently in selection mode)
      selectedDealIds: state.isSelectionMode ? [] : state.selectedDealIds,
      isAllSelected: false,
    }));
  },

  selectAll: () => {
    set((state: PipelineState) => ({
      selectedDealIds: state.deals.map(deal => deal.id),
      isAllSelected: true,
    }));
  },

  clearSelection: () => {
    set((state: PipelineState) => ({
      selectedDealIds: [],
      isAllSelected: false,
    }));
  },

  // Bulk Operations
  bulkDeleteDeals: async (dealIds: string[]) => {
    const state = get();

    try {
      // Optimistic update: remove deals from store immediately
      const dealsToDelete = state.deals.filter(deal => dealIds.includes(deal.id));
      const remainingDeals = state.deals.filter(deal => !dealIds.includes(deal.id));

      set((state: PipelineState) => ({
        deals: remainingDeals,
        selectedDealIds: [],
        isAllSelected: false,
        loading: { ...state.loading, isLoading: true },
        error: null,
      }));

      // Call API to actually delete deals
      const result = await deleteMultipleDeals(dealIds);

      // If successful, refresh deals and metrics
      if (result.deleted_count > 0) {
        // Refresh deals to get updated pagination
        const actions = get() as PipelineState & PipelineActions;
        await actions.fetchDeals();

        // Refresh metrics since deal count changed
        await actions.fetchPipelineMetrics();
      }

      set((state: PipelineState) => ({
        loading: { ...state.loading, isLoading: false },
      }));

      return {
        success: true,
        deletedCount: result.deleted_count,
        failedDeals: result.failed_deals,
      };

    } catch (error) {
      // Rollback: restore deals to store
      set((state: PipelineState) => ({
        deals: state.deals,
        selectedDealIds: state.selectedDealIds,
        loading: { ...state.loading, isLoading: false },
        error: {
          message: 'Failed to delete deals. Please try again.',
          code: 'BULK_DELETE_ERROR'
        },
      }));

      return {
        success: false,
        deletedCount: 0,
        failedDeals: dealIds,
      };
    }
  },

  // Bulk Status Update
  bulkUpdateStatus: async (dealIds: string[], newStatus: 'active' | 'draft' | 'dead') => {
    const state = get();

    try {
      // Set loading state for status updates
      set((state: PipelineState) => ({
        loading: { ...state.loading, isUpdatingStatus: true },
        error: null,
      }));

      // Optimistic update: immediately update deal statuses in store
      const updatedDeals = state.deals.map(deal =>
        dealIds.includes(deal.id)
          ? { ...deal, status: newStatus }
          : deal
      );

      set((state: PipelineState) => ({
        deals: updatedDeals,
        selectedDealIds: [],
        isAllSelected: false,
      }));

      // Call API to update statuses
      const result = await updateMultipleDealStatuses(dealIds, newStatus);

      if (result.updated_count > 0) {
        // Refresh deals to get updated data
        const actions = get() as PipelineState & PipelineActions;
        await actions.fetchDeals();

        // Refresh metrics since status counts changed
        await actions.fetchPipelineMetrics();
      }

      set((state: PipelineState) => ({
        loading: { ...state.loading, isUpdatingStatus: false },
      }));

      return {
        success: true,
        updatedCount: result.updated_count,
        failedDeals: result.failed_deals,
      };

    } catch (error) {
      // Rollback: restore original deal statuses
      set((state: PipelineState) => ({
        deals: state.deals, // Restore original deals
        selectedDealIds: state.selectedDealIds,
        loading: { ...state.loading, isUpdatingStatus: false },
        error: {
          message: 'Failed to update deal statuses. Please try again.',
          code: 'BULK_STATUS_UPDATE_ERROR'
        },
      }));

      return {
        success: false,
        updatedCount: 0,
        failedDeals: dealIds,
      };
    }
  },

  // Utility Actions
  clearError: () => {
    set({ error: null });
  },
});
