'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { endpoints } from '@/lib/api/endpoints';
import { GetModelRequest, GetModelResponse } from '@/types/api/getModel';

export async function getModel(dealData: GetModelRequest): Promise<GetModelResponse> {
  try {
    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(endpoints.getModel, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(dealData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating model:', error);
    throw error;
  }
}
