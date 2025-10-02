'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { CancelSubscriptionResponse } from '@/types/billing';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Cancels the user's subscription
 * @returns Promise<CancelSubscriptionResponse> - Cancellation result
 */
export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
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

    // Make API call to backend cancel subscription endpoint
    const response = await fetch(endpoints.billing.cancelSubscription, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result: CancelSubscriptionResponse = await response.json();

    return result;

  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}
