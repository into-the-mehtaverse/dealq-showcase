import { endpoints } from "@/lib/api/endpoints";
import { supabase } from '@/lib/supabase/client';

interface FileMetadata {
  document_type: string;
  file_type: string;
  original_filename: string;
}

interface RequestUploadResponse {
  deal_id: string;
  upload_id: string;
  upload_info: Array<{
    document_type: string;
    file_type: string;
    original_filename: string;
    upload_url: string;
    file_path: string;
    unique_filename: string;
  }>;
  message: string;
}

export async function requestUpload(files: FileMetadata[]): Promise<RequestUploadResponse> {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Prepare the request payload
    const payload = {
      files: files,
      user_id: session.user.id
    };

    // Send request to FastAPI backend with authentication header
    const response = await fetch(endpoints.requestUpload, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result: RequestUploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error requesting upload:', error);
    throw error;
  }
}
