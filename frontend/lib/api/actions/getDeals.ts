'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { DealSummary } from '@/types/api/dealSummary';
import { endpoints } from '@/lib/api/endpoints';

// Define the new response type
interface DashboardDealsResponse {
  deals: DealSummary[];
  active_deals_count: number;
  last_30_days_total_value: number;
  draft_deals_count: number;
  last_30_days_deals_count: number;
}

/**
 * Fetches all deals for the authenticated user with dashboard metrics
 * @returns Promise<DashboardDealsResponse> - Dashboard data including deals and metrics
 */
export async function getDeals(): Promise<DashboardDealsResponse> {
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

    // Make API call to backend dashboard endpoint
    const response = await fetch(endpoints.getDeals, {
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

    const dashboardData: DashboardDealsResponse = await response.json();
    return dashboardData;

  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}
