import { APIUploadResponse } from '@/types/api/uploadNew';
import { EditablePropertyDetails } from '@/types/property';
import { FinancialSummary } from '../t-12-service';

// Core type definitions
export interface PropertyDetails extends EditablePropertyDetails {}

export type VerificationTab = 'property' | 't12' | 'rent-roll';

// State interface
export interface VerificationState {
  // Core deal data
  dealResponse: APIUploadResponse | null;
  currentDealId: string | null;

  // Editable verification data
  propertyDetails: PropertyDetails;
  t12Data: Array<Record<string, unknown>>;
  rentRollData: Array<Record<string, unknown>>;

  // Computed financials from T12 data
  computedFinancials: FinancialSummary | null;

  // UI state
  isLoading: boolean;
  activeTab: VerificationTab;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;

  // Sidebar state
  rightSidebarOpen: boolean;
  selectedDocumentType: 'T12' | 'RR' | null;

  // Error state
  error: string | null;
}

// Actions interface
export interface VerificationActions {
  // Core actions
  setDealResponse: (response: APIUploadResponse) => void;
  setCurrentDealId: (dealId: string) => void;

  // Property details actions
  updatePropertyDetails: (details: Partial<PropertyDetails>) => void;
  resetPropertyDetails: () => void;

  // T12 data actions
  updateT12Data: (data: Array<Record<string, unknown>>) => void;
  updateT12Row: (index: number, rowData: Record<string, unknown>) => void;
  addT12Row: (rowData: Record<string, unknown>) => void;
  removeT12Row: (index: number) => void;
  resetT12Data: () => void;

  // Computed financials actions
  recalculateFinancials: () => void;
  setComputedFinancials: (financials: FinancialSummary) => void;
  clearComputedFinancials: () => void;

  // Rent roll data actions
  updateRentRollData: (data: Array<Record<string, unknown>>) => void;
  updateRentRollRow: (index: number, rowData: Record<string, unknown>) => void;
  addRentRollRow: (rowData: Record<string, unknown>) => void;
  removeRentRollRow: (index: number) => void;
  resetRentRollData: () => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: VerificationTab) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setLastSaved: (date: Date) => void;
  setError: (error: string | null) => void;

  // Sidebar actions
  setRightSidebarOpen: (open: boolean) => void;
  setSelectedDocumentType: (type: 'T12' | 'RR' | null) => void;

  // Utility actions
  resetStore: () => void;
  markAsChanged: () => void;
  clearChanges: () => void;
  initializeFromDealResponse: (response: APIUploadResponse) => void;
}

// Complete store interface
export interface VerificationStore extends VerificationState, VerificationActions {}

// Initial state
export const initialState: VerificationState = {
  dealResponse: null,
  currentDealId: null,
  propertyDetails: {},
  t12Data: [],
  rentRollData: [],
  computedFinancials: null,
  isLoading: false,
  activeTab: 'property',
  hasUnsavedChanges: false,
  lastSaved: null,
  rightSidebarOpen: false,
  selectedDocumentType: null,
  error: null,
};
