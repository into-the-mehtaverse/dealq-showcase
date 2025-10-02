'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { endpoints } from '@/lib/api/endpoints';

// Request type for updating deals - only includes user-editable fields
export interface UpdateDealRequest {
  // Basic property information (safe to edit)
  property_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  number_of_units?: number;
  year_built?: number;
  parking_spaces?: number;
  gross_square_feet?: number;

  // Financial information (safe to edit)
  asking_price?: number;
  revenue?: number;
  expenses?: number;

  // Descriptions (safe to edit)
  description?: string;
  market_description?: string;
}

// Response type for deal updates - includes file URLs like DealResponse
export interface UpdateDealResponse {
  id: string;
  user_id: string;
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
  revenue?: number;
  expenses?: number;
  description?: string;
  market_description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  t12?: Array<Record<string, unknown>>;
  rent_roll?: Array<Record<string, unknown>>;

  // File URLs (signed URLs for frontend access)
  excel_file_url?: string;
  t12_file_url?: string;
  rent_roll_file_url?: string;
  om_file_url?: string;
  image_url?: string;  // Signed URL, different from image_path

  // AI-processed classification data
  om_classification?: Record<string, unknown>;
}

/**
 * Updates a specific deal by ID for the authenticated user
 * @param dealId - The UUID of the deal to update
 * @param updateData - The fields to update
 * @returns Promise<UpdateDealResponse> - The updated deal
 */
export async function updateDeal(
  dealId: string,
  updateData: UpdateDealRequest
): Promise<UpdateDealResponse> {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the current session using server-side client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('No authenticated session found');
    }

    // Make API call to backend updateDeal endpoint
    const response = await fetch(`${endpoints.getDeal}/${dealId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const updatedDeal: UpdateDealResponse = await response.json();

    return updatedDeal;

  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
}
