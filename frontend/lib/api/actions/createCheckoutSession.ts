'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '@/types/billing';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Creates a Stripe checkout session for subscription
 * @param request - Checkout session request data
 * @returns Promise<CreateCheckoutSessionResponse> - Checkout session details
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
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

    // Make API call to backend createCheckoutSession endpoint
    const response = await fetch(endpoints.billing.createCheckoutSession, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const checkoutData: CreateCheckoutSessionResponse = await response.json();

    return checkoutData;

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
