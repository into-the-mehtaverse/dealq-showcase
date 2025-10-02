'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { DealSummary } from '@/types/api/dealSummary';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Fetches a specific deal by ID for the authenticated user
 * @param dealId - The UUID of the deal to fetch
 * @returns Promise<DealSummary> - The specific deal
 */
export async function getDeal(dealId: string): Promise<DealSummary> {
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

    // Make API call to backend getDeal endpoint
    const response = await fetch(`${endpoints.getDeal}/${dealId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const deal: DealSummary = await response.json();

    return deal;

  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
}
