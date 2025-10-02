import { DealSummary } from '@/types/property';
import { UnderwritingAnalysis, UnderwritingAssumptions } from '@/lib/underwrite';

// Store state interface
export interface DealStoreState {
  // Core deal data
  dealData: DealSummary | null;
  originalDealData: DealSummary | null; // Track original state for comparison

  // Editable fields - tracks current edits
  editableFields: Partial<DealSummary>;

  // Calculated underwriting metrics
  calculatedMetrics: UnderwritingAnalysis | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean; // Track if there are unsaved changes
  isEditing: boolean; // Global edit mode state
}

// Store actions interface
export interface DealStoreActions {
  // Data fetching
  fetchDeal: (dealId: string) => Promise<void>;

  // Editable fields management
  updateEditableField: (field: keyof DealSummary, value: any) => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
  resetToOriginal: () => void;
  markAsChanged: () => void;

  // Edit mode management
  startEditing: () => void;
  cancelEditing: () => void;

  // Underwriting calculations
  recalculateUnderwriting: (newAssumptions: UnderwritingAssumptions) => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

// Complete store interface
export interface DealStore extends DealStoreState, DealStoreActions {}

// Initial state
export const initialState: DealStoreState = {
  dealData: null,
  originalDealData: null,
  editableFields: {},
  calculatedMetrics: null,
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
  isEditing: false,
};
