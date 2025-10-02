'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { CreatePortalSessionResponse } from '@/types/billing';
import { endpoints } from '@/lib/api/endpoints';

/**
 * Creates a Stripe customer portal session
 * @returns Promise<CreatePortalSessionResponse> - Portal session details
 */
export async function createPortalSession(): Promise<CreatePortalSessionResponse> {
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

    // Make API call to backend create portal session endpoint
    const response = await fetch(endpoints.billing.createPortalSession, {
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

    const result: CreatePortalSessionResponse = await response.json();

    return result;

  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}
