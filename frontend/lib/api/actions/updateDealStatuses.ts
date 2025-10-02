'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { endpoints } from '@/lib/api/endpoints';

export interface UpdateDealStatusResponse {
  message: string;
  updated_count: number;
  failed_deals: string[];
  total_requested: number;
}

export async function updateMultipleDealStatuses(
  dealIds: string[],
  newStatus: 'active' | 'draft' | 'dead'
): Promise<UpdateDealStatusResponse> {
  try {
    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(endpoints.pipelineUpdateStatus, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        deal_ids: dealIds,
        status: newStatus
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update deal statuses: ${response.statusText}`);
    }

    const data: UpdateDealStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating multiple deal statuses:', error);
    throw error;
  }
}
