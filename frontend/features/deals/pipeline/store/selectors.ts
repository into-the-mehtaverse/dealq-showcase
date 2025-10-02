import { PipelineState } from './types';

// Basic State Selectors
export const selectMetrics = (state: PipelineState) => state.metrics;
export const selectDeals = (state: PipelineState) => state.deals;
export const selectPagination = (state: PipelineState) => state.pagination;
export const selectCurrentFilters = (state: PipelineState) => state.currentFilters;
export const selectCurrentSort = (state: PipelineState) => state.currentSort;
export const selectAppliedFilters = (state: PipelineState) => state.appliedFilters;
export const selectLoading = (state: PipelineState) => state.loading;
export const selectError = (state: PipelineState) => state.error;
export const selectSelectedDealIds = (state: PipelineState) => state.selectedDealIds;
export const selectIsAllSelected = (state: PipelineState) => state.isAllSelected;

// Computed Selectors
export const selectIsLoading = (state: PipelineState) => state.loading.isLoading;
export const selectIsLoadingMetrics = (state: PipelineState) => state.loading.isLoadingMetrics;
export const selectIsUpdatingStatus = (state: PipelineState) => state.loading.isUpdatingStatus;

export const selectCurrentPage = (state: PipelineState) => state.pagination.current_page;
export const selectTotalPages = (state: PipelineState) => state.pagination.total_pages;
export const selectTotalCount = (state: PipelineState) => state.pagination.total_count;
export const selectHasNext = (state: PipelineState) => state.pagination.has_next;
export const selectHasPrevious = (state: PipelineState) => state.pagination.has_previous;

export const selectSortBy = (state: PipelineState) => state.currentSort.sort_by;
export const selectSortOrder = (state: PipelineState) => state.currentSort.sort_order;

// Filter-specific selectors
export const selectStatusFilter = (state: PipelineState) => state.currentFilters.status;
export const selectUnitsFilter = (state: PipelineState) => ({
  min: state.currentFilters.min_units,
  max: state.currentFilters.max_units,
});
export const selectPriceFilter = (state: PipelineState) => ({
  min: state.currentFilters.min_price,
  max: state.currentFilters.max_price,
});
export const selectYearBuiltFilter = (state: PipelineState) => ({
  min: state.currentFilters.min_year_built,
  max: state.currentFilters.max_year_built,
});
export const selectCitiesFilter = (state: PipelineState) => state.currentFilters.cities || [];
export const selectStatesFilter = (state: PipelineState) => state.currentFilters.states || [];

// Selection selectors
export const selectSelectedCount = (state: PipelineState) => state.selectedDealIds.length;
export const selectHasSelection = (state: PipelineState) => state.selectedDealIds.length > 0;
export const selectIsSelectionMode = (state: PipelineState) => state.isSelectionMode;

// Computed filter state
export const selectHasActiveFilters = (state: PipelineState) => {
  const filters = state.currentFilters;
  return !!(
    filters.status ||
    filters.min_units ||
    filters.max_units ||
    filters.min_price ||
    filters.max_price ||
    filters.min_year_built ||
    filters.max_year_built ||
    (filters.cities && filters.cities.length > 0) ||
    (filters.states && filters.states.length > 0)
  );
};

export const selectFilterSummary = (state: PipelineState) => {
  const filters = state.currentFilters;
  const summary = [];

  if (filters.status) summary.push(`Status: ${filters.status}`);
  if (filters.min_units || filters.max_units) {
    const units = [];
    if (filters.min_units) units.push(`Min: ${filters.min_units}`);
    if (filters.max_units) units.push(`Max: ${filters.max_units}`);
    summary.push(`Units: ${units.join(', ')}`);
  }
  if (filters.min_price || filters.max_price) {
    const price = [];
    if (filters.min_price) price.push(`Min: $${filters.min_price.toLocaleString()}`);
    if (filters.max_price) price.push(`Max: $${filters.max_price.toLocaleString()}`);
    summary.push(`Price: ${price.join(', ')}`);
  }
  if (filters.min_year_built || filters.max_year_built) {
    const year = [];
    if (filters.min_year_built) year.push(`Min: ${filters.min_year_built}`);
    if (filters.max_year_built) year.push(`Max: ${filters.max_year_built}`);
    summary.push(`Year Built: ${year.join(', ')}`);
  }
  if (filters.cities && filters.cities.length > 0) {
    summary.push(`Cities: ${filters.cities.join(', ')}`);
  }
  if (filters.states && filters.states.length > 0) {
    summary.push(`States: ${filters.states.join(', ')}`);
  }

  return summary;
};
