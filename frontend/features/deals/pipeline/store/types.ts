import { DealSummary } from '@/types/property';

// Pipeline Metrics
export interface PipelineMetrics {
  totalDealsCount: number;
  activeDealsCount: number;
  draftDealsCount: number;
  deadDealsCount: number;
}

// Filter Types
export interface PipelineFilters {
  status?: 'active' | 'draft' | 'dead';
  min_units?: number;
  max_units?: number;
  min_price?: number;
  max_price?: number;
  min_year_built?: number;
  max_year_built?: number;
  cities?: string[];
  states?: string[];
}

// Sort Configuration
export interface PipelineSort {
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

// Pagination
export interface PipelinePagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

// Loading States
export interface PipelineLoading {
  isLoading: boolean;
  isLoadingMetrics: boolean;
  isUpdatingStatus: boolean;
}

// Error State
export interface PipelineError {
  message: string;
  code?: string;
}

// Main Store State
export interface PipelineState {
  // Metrics (static source of truth)
  metrics: PipelineMetrics | null;

  // Deals Data
  deals: DealSummary[];
  pagination: PipelinePagination;

  // Filters & Sorting
  currentFilters: PipelineFilters;
  currentSort: PipelineSort;
  appliedFilters: PipelineFilters;

  // Loading & Error States
  loading: PipelineLoading;
  error: PipelineError | null;

  // Selection State (for future use)
  selectedDealIds: string[];
  isAllSelected: boolean;
  isSelectionMode: boolean;
}

// Action Types
export interface PipelineActions {
  // Metrics
  fetchPipelineMetrics: () => Promise<void>;

  // Deals
  fetchDeals: (page?: number) => Promise<void>;

  // Filters & Sorting
  setFilters: (filters: Partial<PipelineFilters>) => void;
  setSort: (sort: Partial<PipelineSort>) => void;
  applyFilters: () => void;
  resetFilters: () => void;

  // Pagination
  setPage: (page: number) => void;

  // Selection (for future use)
  toggleSelection: (dealId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;

  // Bulk Operations
  bulkDeleteDeals: (dealIds: string[]) => Promise<{ success: boolean; deletedCount: number; failedDeals: string[] }>;
  bulkUpdateStatus: (dealIds: string[], newStatus: 'active' | 'draft' | 'dead') => Promise<{ success: boolean; updatedCount: number; failedDeals: string[] }>;

  // Utility
  clearError: () => void;
}

// Combined Store Type
export type PipelineStore = PipelineState & PipelineActions;

// API Response Types
export interface PipelineDealsResponse {
  deals: DealSummary[];
  pagination: PipelinePagination;
}

export interface PipelineMetricsResponse {
  totalDealsCount: number;
  activeDealsCount: number;
  draftDealsCount: number;
  deadDealsCount: number;
}

export interface BulkStatusUpdateResponse {
  message: string;
  updated_count: number;
  failed_deals: string[];
  total_requested: number;
}
