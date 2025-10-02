'use server'

import { endpoints } from "@/lib/api/endpoints";
import { APIUploadResponse } from "@/types/api/uploadNew";
import { createClient } from '@/lib/supabase/serverClient';

interface UploadedFileInfo {
  file: File;
  documentType: string;
  fileType: string;
}

export async function uploadDeal(files: UploadedFileInfo[]): Promise<APIUploadResponse> {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Validate that at least one file is provided
    if (files.length === 0) {
      throw new Error('At least one file is required');
    }

    // Create server-side Supabase client and get current session
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('Authentication required. Please log in.');
    }

    // Create FormData for the multi-file upload
    const formData = new FormData();

    // Add each file with its metadata
    files.forEach((fileInfo, index) => {
      console.log(`Adding file ${index}: documentType=${fileInfo.documentType}, fileType=${fileInfo.fileType}, filename=${fileInfo.file.name}`);
      formData.append(`file_${index}`, fileInfo.file);
      formData.append(`document_type_${index}`, fileInfo.documentType);
      formData.append(`file_type_${index}`, fileInfo.fileType);
    });

    // Add the total number of files
    formData.append('file_count', files.length.toString());

    // Send request to FastAPI backend with authentication header
    const response = await fetch(endpoints.uploadDeal, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result: APIUploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}
