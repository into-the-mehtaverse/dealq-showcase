"use client";

import { useState, useEffect } from 'react';
import { PipelineTab } from './pipeline-tabs';
import PipelineMetrics from './pipeline-metrics';
import PipelineTabs from './pipeline-tabs';
import PipelineDealsGrid from './pipeline-deals-grid';
import PipelineFilters from './pipeline-filters';
import PipelineSorting from './pipeline-sorting';
import PipelineSelectionControls from './pipeline-selection-controls';
import {
  usePipelineStore,
  selectMetrics,
  selectDeals,
  selectPagination,
  selectError,
  selectCurrentFilters,
  selectCurrentSort,
  selectIsLoading,
  selectIsSelectionMode
} from './store';

export default function PipelineDashboard() {
  // Store state
  const metrics = usePipelineStore(selectMetrics);
  const deals = usePipelineStore(selectDeals);
  const pagination = usePipelineStore(selectPagination);
  const error = usePipelineStore(selectError);
  const currentFilters = usePipelineStore(selectCurrentFilters);
  const currentSort = usePipelineStore(selectCurrentSort);
  const isLoading = usePipelineStore(selectIsLoading);

  // Get selection mode from store
  const isSelectionMode = usePipelineStore(selectIsSelectionMode);

  // Store actions
  const {
    fetchPipelineMetrics,
    fetchDeals,
    setFilters,
    setSort,
    setPage
  } = usePipelineStore();

  // Local state for tab management (will be moved to store later)
  const [selectedTab, setSelectedTab] = useState<PipelineTab>('all');





  // Handle tab change
  const handleTabChange = (tab: PipelineTab) => {
    setSelectedTab(tab);
    // Update filters based on tab and reset to first page
    const tabFilters = tab === 'all' ? {} : { status: tab };
    setFilters(tabFilters);
    // Note: setFilters will trigger useEffect which will call fetchDeals
    // We don't need to call setPage(1) here as it would cause duplicate API calls
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<typeof currentFilters>) => {
    setFilters(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (newSortConfig: Partial<typeof currentSort>) => {
    setSort(newSortConfig);
  };



  // Initial data fetch - metrics are fetched once and remain static
  useEffect(() => {
    fetchPipelineMetrics(); // Get static pipeline metrics (only once)
    fetchDeals(); // Get initial deals
  }, []); // Only run on mount

  // Refetch deals when filters, sorting, or tab changes
  // Note: Metrics are NOT updated here - they remain static
  // Note: Pagination is handled by setPage action, so we don't need it as a dependency
  useEffect(() => {
    if (currentFilters || currentSort || selectedTab) {
      fetchDeals();
    }
  }, [currentFilters, currentSort, selectedTab]);

  return (
    <div className="container bg-background rounded-lg mx-auto p-6">
      {/* Pipeline Metrics */}
      {metrics && (
        <PipelineMetrics
          totalDealsCount={metrics.totalDealsCount}
          activeDealsCount={metrics.activeDealsCount}
          draftDealsCount={metrics.draftDealsCount}
          deadDealsCount={metrics.deadDealsCount}
          className="mb-8"
        />
      )}

      {/* Pipeline Tabs with Filter and Sort Controls */}
      <div className="mb-6 flex items-center gap-6 px-6">
        <PipelineTabs
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
        />

        {/* Filter, Sort, and Selection Controls */}
        <div className="flex items-center gap-2">
          <PipelineFilters
            filters={{
              min_units: currentFilters.min_units,
              max_units: currentFilters.max_units,
              min_price: currentFilters.min_price,
              max_price: currentFilters.max_price,
              min_year_built: currentFilters.min_year_built,
              max_year_built: currentFilters.max_year_built,
              cities: currentFilters.cities || [],
              states: currentFilters.states || []
            }}
            onFiltersChange={handleFiltersChange}
          />
          <PipelineSorting
            sortConfig={currentSort}
            onSortChange={handleSortChange}
          />
          <PipelineSelectionControls />
        </div>
      </div>

      {/* Pipeline Deals Grid */}
      <PipelineDealsGrid
        deals={deals}
        loading={isLoading}
        error={error?.message || null}
        currentPage={pagination.current_page}
        totalPages={pagination.total_pages}
        totalCount={pagination.total_count}
        hasNext={pagination.has_next}
        hasPrevious={pagination.has_previous}
        onPageChange={handlePageChange}
        isSelectionMode={isSelectionMode}
      />
    </div>
  );
}
