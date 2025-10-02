'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { endpoints } from '@/lib/api/endpoints';

// Define the response type for status update
interface UpdateDealStatusResponse {
  message: string;
  deal_id: string;
  new_status: string;
  updated_at: string;
}

/**
 * Updates the status of a deal in the pipeline
 * @param dealId - UUID of the deal to update
 * @param status - New status (active, draft, dead)
 * @returns Promise<UpdateDealStatusResponse> - Update confirmation details
 */
export async function updateDealStatus(
  dealId: string,
  status: string
): Promise<UpdateDealStatusResponse> {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the current user and session for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (userError || sessionError) {
      throw new Error(`Authentication error: ${userError?.message || sessionError?.message}`);
    }

    if (!user || !session) {
      throw new Error('No authenticated user found');
    }

    // Validate status parameter
    const validStatuses = ['active', 'draft', 'dead'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Make API call to backend pipeline status update endpoint
    const response = await fetch(`${endpoints.pipelineUpdateStatus}/${dealId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const updateData: UpdateDealStatusResponse = await response.json();
    return updateData;

  } catch (error) {
    console.error('Error updating deal status:', error);
    throw error;
  }
}
