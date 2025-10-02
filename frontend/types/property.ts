// Shared property types - single source of truth for all property-related data structures

// For classification results (with page references)
export interface ExtractedPropertyInfo {
  value: string;
  first_page: number;
}

// Core property fields that are consistent across all contexts
export interface PropertyFields {
  property_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  number_of_units?: number;
  year_built?: number;
  parking_spaces?: number;
  gross_square_feet?: number;
  asking_price?: number;
}

// For classification results (with page references)
export interface EnhancedClassificationResult {
  property_name?: ExtractedPropertyInfo | null;
  address?: ExtractedPropertyInfo | null;
  city?: ExtractedPropertyInfo | null;
  state?: ExtractedPropertyInfo | null;
  zip_code?: ExtractedPropertyInfo | null;
  number_of_units?: ExtractedPropertyInfo | null;
  year_built?: ExtractedPropertyInfo | null;
  parking_spaces?: ExtractedPropertyInfo | null;
  gross_square_feet?: ExtractedPropertyInfo | null;
  asking_price?: ExtractedPropertyInfo | null;
  t12: number[];
  rent_roll: number[];
}

// For editable forms (primitive values)
export interface EditablePropertyDetails extends PropertyFields {
  description?: string;
  market_description?: string;
}

// For display/deal summary (primitive values + additional fields)
export interface DealSummary extends PropertyFields {
  id: string;
  description?: string;
  market_description?: string;
  excel_file_url?: string;
  t12_file_url?: string;
  rent_roll_file_url?: string;
  om_file_url?: string;
  image_url?: string;
  revenue?: number;
  expenses?: number;
  om_classification?: Record<string, any>;
  t12?: Array<Record<string, any>>;
  rent_roll?: Array<Record<string, any>>;
  status?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}
