import { endpoints } from "@/lib/api/endpoints";
import { supabase } from '@/lib/supabase/client';

interface ConfirmUploadRequest {
  upload_id: string;
  deal_id: string;
  uploaded_successfully: boolean;
}

interface ConfirmUploadResponse {
  confirm_result: {
    success: boolean;
    upload_id: string;
    message: string;
  };
  job_id: string;
  deal_id: string;
  processing_completed: boolean;
}

export async function confirmUpload(request: ConfirmUploadRequest): Promise<ConfirmUploadResponse> {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Send request to FastAPI backend with authentication header
    const response = await fetch(endpoints.confirmUpload, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result: ConfirmUploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error confirming upload:', error);
    throw error;
  }
}
