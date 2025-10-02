
interface UploadInfo {
  upload_url: string;
  original_filename: string;
  document_type: string;
  file_type: string;
}

interface UploadToStorageResult {
  success: boolean;
  errors?: string[];
  uploadedFiles?: string[];
}

export async function uploadToStorage(
  files: File[],
  uploadInfo: UploadInfo[]
): Promise<UploadToStorageResult> {
  try {
    if (!files || !uploadInfo || files.length !== uploadInfo.length) {
      throw new Error('Files and upload info must match in length');
    }

    const errors: string[] = [];
    const uploadedFiles: string[] = [];

    // Upload each file to its corresponding presigned URL
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const info = uploadInfo[i];

      try {
        // Upload file to presigned URL
        const uploadResponse = await fetch(info.upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          const errorMsg = `Failed to upload ${info.original_filename}: ${uploadResponse.status} - ${errorText}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        } else {
          uploadedFiles.push(info.original_filename);
          console.log(`Successfully uploaded ${info.original_filename}`);
        }
      } catch (error) {
        const errorMsg = `Error uploading ${info.original_filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Determine overall success
    const success = errors.length === 0 && uploadedFiles.length === files.length;

    return {
      success,
      errors: errors.length > 0 ? errors : undefined,
      uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };

  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
