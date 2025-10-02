'use server'

import { endpoints } from "@/lib/api/endpoints";
import { createClient } from '@/lib/supabase/serverClient';

export interface DeleteDealResponse {
  message: string;
}

export interface DeleteMultipleDealsResponse {
  message: string;
  deleted_count: number;
  failed_deals: string[];
}

export async function deleteDeal(dealId: string): Promise<DeleteDealResponse> {
  try {
    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${endpoints.deleteDeal}/${dealId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete deal: ${response.statusText}`);
    }

    const data: DeleteDealResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}

export async function deleteMultipleDeals(dealIds: string[]): Promise<DeleteMultipleDealsResponse> {
  try {
    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(endpoints.deleteDeal, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ deal_ids: dealIds }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete deals: ${response.statusText}`);
      } catch {
        throw new Error(`Failed to delete deals: ${response.statusText}`);
      }
    }

    const data: DeleteMultipleDealsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting multiple deals:', error);
    throw error;
  }
}
