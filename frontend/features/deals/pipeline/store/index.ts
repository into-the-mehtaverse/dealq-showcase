// Main store hook
export { usePipelineStore } from './store';

// Store actions for direct access
export { pipelineActions } from './store';

// Store instance for direct access
export { pipelineStore } from './store';

// Types
export type {
  PipelineStore,
  PipelineState,
  PipelineActions,
  PipelineMetrics,
  PipelineFilters,
  PipelineSort,
  PipelinePagination,
  PipelineLoading,
  PipelineError,
  PipelineDealsResponse,
  PipelineMetricsResponse,
} from './types';

// Selectors
export {
  selectMetrics,
  selectDeals,
  selectPagination,
  selectCurrentFilters,
  selectCurrentSort,
  selectAppliedFilters,
  selectLoading,
  selectError,
  selectSelectedDealIds,
  selectIsAllSelected,
  selectIsLoading,
  selectIsLoadingMetrics,
  selectIsUpdatingStatus,
  selectCurrentPage,
  selectTotalPages,
  selectTotalCount,
  selectHasNext,
  selectHasPrevious,
  selectSortBy,
  selectSortOrder,
  selectStatusFilter,
  selectUnitsFilter,
  selectPriceFilter,
  selectYearBuiltFilter,
  selectCitiesFilter,
  selectStatesFilter,
  selectSelectedCount,
  selectHasSelection,
  selectIsSelectionMode,
  selectHasActiveFilters,
  selectFilterSummary,
} from './selectors';
