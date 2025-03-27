// src/components/UploadForm.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud } from 'lucide-react';

interface UploadFormProps {
  onUpload: (file: File) => Promise<void>;
  onS3Import: (key: string) => Promise<void>;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUpload, onS3Import }) => {
  const [uploading, setUploading] = useState<Array<{
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
  }>>([]);
  const [s3Key, setS3Key] = useState('');

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/aac': ['.aac'],
    },
    maxFiles: 1,
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add file to uploading list
    setUploading(prev => [...prev, {
      id: fileId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }]);

    try {
      // Start progress simulation
      const progressInterval = simulateProgress(fileId);
      
      // Perform the actual upload
      await onUpload(file);
      
      // Clear interval and set status to completed
      clearInterval(progressInterval);
      setUploading(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, progress: 100, status: 'completed' } 
            : item
        )
      );
      
      // Remove from list after a delay
      setTimeout(() => {
        setUploading(prev => prev.filter(item => item.id !== fileId));
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'error' } 
            : item
        )
      );
    }
  };

  // Simulate progress
  const simulateProgress = (fileId: string) => {
    return setInterval(() => {
      setUploading(prev => {
        const currentItem = prev.find(item => item.id === fileId);
        if (!currentItem || currentItem.status === 'completed' || currentItem.status === 'error') {
          return prev;
        }
        
        const newProgress = Math.min(currentItem.progress + Math.floor(Math.random() * 10) + 1, 95);
        
        return prev.map(item => 
          item.id === fileId 
            ? { ...item, progress: newProgress, status: 'uploading' } 
            : item
        );
      });
    }, 300);
  };

  // Handle S3 import
  const handleS3Import = async () => {
    if (!s3Key) return;
    
    const fileId = `s3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to uploading list
    setUploading(prev => [...prev, {
      id: fileId,
      name: `S3 Import: ${s3Key}`,
      size: 0,
      progress: 0,
      status: 'pending'
    }]);

    try {
      // Start progress simulation
      const progressInterval = simulateProgress(fileId);
      
      // Perform the actual import
      await onS3Import(s3Key);
      
      // Clear interval and set status to completed
      clearInterval(progressInterval);
      setUploading(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, progress: 100, status: 'completed' } 
            : item
        )
      );
      
      // Clear S3 key input
      setS3Key('');
      
      // Remove from list after a delay
      setTimeout(() => {
        setUploading(prev => prev.filter(item => item.id !== fileId));
      }, 3000);
    } catch (error) {
      console.error('S3 import error:', error);
      setUploading(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'error' } 
            : item
        )
      );
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          } rounded-lg p-6 text-center cursor-pointer`}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Upload AAC Audio Files</h2>
          <p className="text-gray-500 mb-4">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag and drop an AAC file here, or click to select a file'}
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="inline-block px-4 py-2 bg-indigo-600 text-white font-medium rounded cursor-pointer hover:bg-indigo-700 transition"
            >
              Browse Files
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-medium mb-4">Import from S3</h2>
        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S3 Object Key
            </label>
            <input 
              type="text" 
              value={s3Key}
              onChange={(e) => setS3Key(e.target.value)}
              placeholder="Enter S3 object key"
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
          <button 
            onClick={handleS3Import}
            disabled={!s3Key}
            className={`px-4 py-2 rounded font-medium ${
              s3Key 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } transition`}
          >
            <Cloud className="h-4 w-4 inline-block mr-2" />
            Import
          </button>
        </div>
      </div>
      
      {/* Current uploads */}
      {uploading.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Current Uploads</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {uploading.map(file => (
              <li key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {file.size > 0 ? formatFileSize(file.size) : 'S3 Import'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-sm text-gray-700">
                      {file.status === 'uploading' ? `${file.progress}%` : file.status}
                    </span>
                  </div>
                </div>
                {file.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full" 
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadForm;