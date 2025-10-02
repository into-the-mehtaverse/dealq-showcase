'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { BillingInfo } from '@/types/billing';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Gets billing information for the authenticated user
 * @returns Promise<BillingInfo> - Current billing status and limits
 */
export async function getBillingInfo(): Promise<BillingInfo> {
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

    // Make API call to backend getBillingInfo endpoint
    const response = await fetch(endpoints.billing.getBillingInfo, {
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

    const billingInfo: BillingInfo = await response.json();

    return billingInfo;

  } catch (error) {
    throw error;
  }
}
