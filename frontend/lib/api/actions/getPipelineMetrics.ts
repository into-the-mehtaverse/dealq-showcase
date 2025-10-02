'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { endpoints } from '@/lib/api/endpoints';

// Define the response type for pipeline metrics
interface PipelineMetricsResponse {
  totalDealsCount: number;
  activeDealsCount: number;
  draftDealsCount: number;
  deadDealsCount: number;
}

/**
 * Fetches pipeline metrics (counts for each deal status)
 * @returns Promise<PipelineMetricsResponse> - Pipeline metrics data
 */
export async function getPipelineMetrics(): Promise<PipelineMetricsResponse> {
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

    // Make API call to backend pipeline metrics endpoint
    const response = await fetch(endpoints.pipelineMetrics, {
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

    const metricsData: PipelineMetricsResponse = await response.json();
    return metricsData;

  } catch (error) {
    console.error('Error fetching pipeline metrics:', error);
    throw error;
  }
}
