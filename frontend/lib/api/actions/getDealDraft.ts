'use server'

import { endpoints } from "@/lib/api/endpoints";
import { createClient } from '@/lib/supabase/serverClient';
import type { APIUploadResponse } from "@/types/api/uploadNew";

export async function getDealDraft(dealId: string): Promise<APIUploadResponse> {
  try {
    if (!dealId) {
      throw new Error('Deal ID is required');
    }

    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Send request to FastAPI backend with authentication header
    const response = await fetch(`${endpoints.getDealDraft}/${dealId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result: APIUploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting deal draft:', error);
    throw error;
  }
}
