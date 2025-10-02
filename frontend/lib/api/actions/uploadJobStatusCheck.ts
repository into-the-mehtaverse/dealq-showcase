'use server'

import { endpoints } from "@/lib/api/endpoints";
import { createClient } from '@/lib/supabase/serverClient';

interface JobStatusResponse {
  job_id: string;
  deal_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  stage: string | null;
  attempts: number;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_text: string | null;
}

export async function checkUploadJobStatus(jobId: string): Promise<JobStatusResponse> {
  try {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Send request to FastAPI backend with authentication header
    const response = await fetch(`${endpoints.uploadJobStatus}/${jobId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result: JobStatusResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking job status:', error);
    throw error;
  }
}
