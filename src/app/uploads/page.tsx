'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UploadForm from '@/components/UploadForm';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function UploadsPage() {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<{
    totalFiles: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      success: boolean;
      filename: string;
      error?: string;
    }>;
  } | null>(null);
  
  const searchParams = useSearchParams();
  // We'll check the source parameter but won't use it directly
  searchParams.get('source'); // Just to check it exists
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setUploadError(null);
      setSuccessMessage(null);
      setBatchResults(null);
      
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
      
      await response.json(); // Process the response but not using the result
      setSuccessMessage(`Successfully uploaded ${file.name}`);
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
      setSuccessMessage(null);
      setBatchResults(null);
      
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
      
      await response.json(); // Process the response but not using the result
      setSuccessMessage(`Successfully imported file from S3: ${s3Key}`);
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
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{uploadError}</span>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}
          
          {batchResults && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Batch Upload Results</h3>
              <div className="flex items-center mb-3">
                <div className="text-blue-700">
                  <span className="font-medium">{batchResults.totalFiles}</span> files processed: 
                  <span className="font-medium text-green-600 ml-2">{batchResults.successCount}</span> successful, 
                  <span className="font-medium text-red-600 ml-2">{batchResults.failureCount}</span> failed
                </div>
              </div>
              
              {batchResults.failureCount > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Failed uploads:</h4>
                  <ul className="text-sm text-red-600 list-disc pl-5">
                    {batchResults.results
                      .filter(r => !r.success)
                      .map((result, index) => (
                        <li key={index}>
                          {result.filename}: {result.error}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
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