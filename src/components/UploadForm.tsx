// src/components/UploadForm.tsx
import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud, CheckCircle, AlertCircle, File, Info } from 'lucide-react';
import { generateFileHashFromFile } from '@/lib/utils/fileHash';

interface UploadFormProps {
  onUpload: (file: File) => Promise<void>;
  onS3Import: (key: string) => Promise<void>;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'duplicate';
  error?: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUpload, onS3Import }) => {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [s3Key, setS3Key] = useState('');
  const [batchUploadProgress, setBatchUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const processingRef = useRef(false);

  // Store file hashes to prevent duplicate uploads in the same batch
  const fileHashesRef = useRef<Set<string>>(new Set());

  // Simulate progress - define before using in onDrop
  const simulateProgress = useCallback((fileId: string) => {
    return setInterval(() => {
      setUploading(prev => {
        const currentItem = prev.find(item => item.id === fileId);
        if (!currentItem || ['completed', 'error', 'duplicate'].includes(currentItem.status)) {
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
  }, []);

  // Check if file is a duplicate
  const checkDuplicate = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Generate hash for the file
      const hash = await generateFileHashFromFile(file);
      
      // Check if hash already exists in our local reference
      if (fileHashesRef.current.has(hash)) {
        return true;
      }
      
      // Check against server API for existing files
      const formData = new FormData();
      formData.append('checkOnly', 'true');
      formData.append('hash', hash);
      
      const response = await fetch('/api/recordings/check-duplicate', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.duplicate) {
        return true;
      }
      
      // If not a duplicate, add to our set for future reference
      fileHashesRef.current.add(hash);
      return false;
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      return false; // Assume not duplicate on error
    }
  }, []);

  // Handle file drop for multiple files
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Clear duplicate files tracking
    setDuplicateFiles([]);
    
    // Handle batch upload for multiple files
    if (acceptedFiles.length > 1) {
      await handleBatchUpload(acceptedFiles);
      return;
    }
    
    // Handle single file upload
    const file = acceptedFiles[0];
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
      // Check for duplicate first
      const isDuplicate = await checkDuplicate(file);
      
      if (isDuplicate) {
        setUploading(prev => 
          prev.map(item => 
            item.id === fileId 
              ? { ...item, progress: 100, status: 'duplicate', error: 'File already exists' } 
              : item
          )
        );
        setDuplicateFiles(prev => [...prev, file.name]);
        return;
      }
      
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
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } 
            : item
        )
      );
    }
  }, [onUpload, simulateProgress, checkDuplicate]);

  // Handle batch upload of multiple files
  const handleBatchUpload = useCallback(async (files: File[]) => {
    if (processingRef.current) return;
    processingRef.current = true;
    
    // Initialize batch upload state
    setTotalFiles(files.length);
    setProcessedFiles(0);
    setBatchUploadProgress(0);
    setDuplicateFiles([]);
    
    // Create entries for all files
    const fileEntries = files.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending' as const
    }));
    
    setUploading(prev => [...prev, ...fileEntries]);
    
    // Process files in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    const fileBatches = [];
    const duplicates: string[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      fileBatches.push(files.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < fileBatches.length; i++) {
      const batch = fileBatches[i];
      await Promise.all(
        batch.map(async (file, index) => {
          const currentIndex = i * batchSize + index;
          const fileId = fileEntries[currentIndex].id;
          
          try {
            // Check for duplicate first
            const isDuplicate = await checkDuplicate(file);
            
            if (isDuplicate) {
              duplicates.push(file.name);
              setUploading(prev => 
                prev.map(item => 
                  item.id === fileId 
                    ? { ...item, progress: 100, status: 'duplicate', error: 'File already exists' } 
                    : item
                )
              );
              
              // Update processed count
              setProcessedFiles(prev => {
                const newValue = prev + 1;
                setBatchUploadProgress(Math.round((newValue / files.length) * 100));
                return newValue;
              });
              
              return;
            }
            
            // Start progress simulation
            const progressInterval = simulateProgress(fileId);
            
            // Perform the actual upload
            await onUpload(file);
            
            // Update file status
            setUploading(prev => 
              prev.map(item => 
                item.id === fileId 
                  ? { ...item, progress: 100, status: 'completed' } 
                  : item
              )
            );
            
            clearInterval(progressInterval);
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            setUploading(prev => 
              prev.map(item => 
                item.id === fileId 
                  ? { 
                      ...item, 
                      status: 'error', 
                      error: error instanceof Error ? error.message : 'Upload failed' 
                    } 
                  : item
              )
            );
          } finally {
            // Update processed count and overall progress
            setProcessedFiles(prev => {
              const newValue = prev + 1;
              setBatchUploadProgress(Math.round((newValue / files.length) * 100));
              return newValue;
            });
          }
        })
      );
    }
    
    // Update duplicate files state
    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
    }
    
    // Clean up completed files after a delay
    setTimeout(() => {
      setUploading(prev => 
        prev.filter(item => ['error', 'uploading'].includes(item.status))
      );
      processingRef.current = false;
    }, 5000);
    
  }, [onUpload, simulateProgress, checkDuplicate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.aac', '.mp3', '.wav', '.m4a', '.ogg'],
      'application/octet-stream': ['.aac', '.mp3', '.wav', '.m4a', '.ogg'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    maxFiles: 100, // Allow up to 100 files
    multiple: true // Enable multiple file selection
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Handle S3 import
  const handleS3Import = useCallback(async () => {
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
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Import failed' } 
            : item
        )
      );
    }
  }, [s3Key, onS3Import, simulateProgress]);

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
          <h2 className="text-lg font-medium mb-2">Upload Audio Files</h2>
          <p className="text-gray-500 mb-4">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag and drop audio files here, or click to select files (up to 100 files)'}
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className="inline-block px-4 py-2 bg-indigo-600 text-white font-medium rounded cursor-pointer hover:bg-indigo-700 transition"
            >
              Browse Files
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate Files Warning */}
      {duplicateFiles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-700">
                {duplicateFiles.length === 1 
                  ? '1 file was skipped (already exists)' 
                  : `${duplicateFiles.length} files were skipped (already exist)`}
              </h3>
              {duplicateFiles.length <= 5 ? (
                <ul className="mt-1 text-xs text-yellow-600 list-disc list-inside">
                  {duplicateFiles.map((file, i) => (
                    <li key={i}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-yellow-600">
                  {duplicateFiles.slice(0, 3).join(', ')} and {duplicateFiles.length - 3} more...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Upload Progress */}
      {totalFiles > 1 && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-md font-medium mb-2">Batch Upload Progress</h3>
          <div className="flex items-center">
            <div className="flex-grow">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-indigo-600 rounded-full" 
                  style={{ width: `${batchUploadProgress}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-700">
              {processedFiles}/{totalFiles} completed
            </span>
          </div>
        </div>
      )}

      {/* File upload list */}
      {uploading.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-md font-medium mb-2">Upload Queue</h3>
          <div className="max-h-60 overflow-y-auto">
            {uploading.map(item => (
              <div key={item.id} className="border-b border-gray-100 py-2 last:border-b-0">
                <div className="flex items-center mb-1">
                  <File className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="text-sm font-medium text-gray-800 truncate flex-grow mr-2">
                    {item.name}
                  </div>
                  {item.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {item.status === 'duplicate' && (
                    <Info className="h-4 w-4 text-yellow-500" />
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-xs text-indigo-600 font-medium">
                      {item.progress}%
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {item.size > 0 && (
                    <span className="mr-2">{formatFileSize(item.size)}</span>
                  )}
                  {item.error && (
                    <span className="text-red-500">{item.error}</span>
                  )}
                  {item.status === 'duplicate' && (
                    <span className="text-yellow-500">File already exists</span>
                  )}
                </div>
                <div className="h-1 bg-gray-100 rounded-full mt-1">
                  <div 
                    className={`h-1 rounded-full ${
                      item.status === 'completed' 
                        ? 'bg-green-500' 
                        : item.status === 'error' 
                          ? 'bg-red-500' 
                          : item.status === 'duplicate'
                            ? 'bg-yellow-500'
                            : 'bg-indigo-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            type="button"
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
    </div>
  );
};

export default UploadForm;