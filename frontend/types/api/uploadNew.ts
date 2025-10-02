// Upload API types that exactly match the backend models

import { EnhancedClassificationResult } from '@/types/property';

// APIUploadRequest - matches backend APIUploadRequest
export interface APIUploadRequest {
  file_count: number;
  // Note: Individual file fields (file_0, file_1, etc.) and their metadata
  // (document_type_0, file_type_0, etc.) are handled directly in the endpoint
  // as they come from FormData
}

// APIUploadResponse - matches backend APIUploadResponse
export interface APIUploadResponse {
  success: boolean;
  message: string;

  // Deal and file information
  deal_id: string;
  files: Array<{
    filename: string;
    document_type: string;
    file_type: string;
    file_url: string;
  }>;

  // File URLs for different document types
  om_file_url?: string | null;
  t12_file_url?: string | null;
  rent_roll_file_url?: string | null;

  // Property information from OM classification
  property_info?: Record<string, any> | null;

  // Structured outputs
  structured_t12?: Array<Record<string, any>> | null;
  structured_rent_roll?: Array<Record<string, any>> | null;

  // Raw extraction results (for debugging/advanced use cases)
  classification_result?: EnhancedClassificationResult | null;

  // Error information
  error_code?: string | null;
  details?: Record<string, any> | null;
}
