// src/app/uploads/page.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UploadForm from '@/components/UploadForm';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UploadsPage() {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source') === 's3' ? 's3' : 'upload';

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', 'upload');
      
      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      // Optionally redirect to recordings list after successful upload
      // router.push('/');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError((error as Error).message || 'Failed to upload file');
      throw error; // Re-throw to let the component handle it
    }
  };

  // Handle S3 import
  const handleS3Import = async (s3Key: string) => {
    try {
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('source', 's3');
      formData.append('s3Key', s3Key);
      
      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import from S3');
      }
      
      // Optionally redirect to recordings list after successful upload
      // router.push('/');
    } catch (error) {
      console.error('S3 import error:', error);
      setUploadError((error as Error).message || 'Failed to import from S3');
      throw error; // Re-throw to let the component handle it
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Upload Call Recordings
            </h1>
          </div>
        </div>
        
        {/* Upload form */}
        <div className="p-4">
          {uploadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {uploadError}
            </div>
          )}
          
          <UploadForm 
            onUpload={handleFileUpload}
            onS3Import={handleS3Import}
          />
        </div>
      </div>
    </div>
  );
}