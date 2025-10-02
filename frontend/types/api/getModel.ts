/**
 * API types for the get_model endpoint.
 *
 * Defines the request and response types for the get_model endpoint that handles
 * user-verified data and returns Excel generation results.
 */

export interface GetModelRequest {
  // Property information (user-verified from frontend)
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

  // Financial data (user-verified from frontend)
  revenue?: number;
  expenses?: number;

  // Structured data (user-verified from frontend)
  structured_t12?: Array<Record<string, any>>;
  structured_rent_roll?: Array<Record<string, any>>;

  // Deal information
  deal_id: string;
}

export interface GetModelResponse {
  success: boolean;
  message: string;
  excel_file_url?: string;
  deal_id: string;
  error_code?: string;
  details?: Record<string, any>;
}
