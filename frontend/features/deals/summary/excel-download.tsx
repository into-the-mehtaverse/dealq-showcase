"use client";

import React from 'react';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DealSummary } from '@/types/property';

interface ExcelDownloadProps {
  dealData: DealSummary;
  className?: string;
}

export default function ExcelDownload({ dealData, className = '' }: ExcelDownloadProps) {
  const handleDownload = async () => {
    if (dealData.excel_file_url) {
      try {
        // Fetch the file as a blob since download attribute doesn't work with cross-origin URLs
        const response = await fetch(dealData.excel_file_url);
        const blob = await response.blob();

        // Create a blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${dealData.property_name || 'deal'}.xlsm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
      }
    } else {
      // Fallback if no URL is available
      alert('Excel file not available for download.');
    }
  };

  return (
    <Card className={className}>
      <CardContent>
        <Button
          onClick={handleDownload}
          className="w-full bg-green-800 hover:bg-green-800/80 text-white"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Completed Excel Model
        </Button>
      </CardContent>
    </Card>
  );
}
