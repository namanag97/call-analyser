'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  User, 
  Volume2 
} from 'lucide-react';

interface Transcription {
  id: string;
  recordingId: string;
  status: string;
  text?: string;
  language: string;
  speakers?: number;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface Recording {
  id: string;
  filename: string;
  filepath: string;
  filesize: number;
  duration?: number;
  agent?: string;
  callType?: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  transcription?: Transcription;
}

export default function RecordingDetailPage() {
  const { id } = useParams();
  const recordingId = Array.isArray(id) ? id[0] : id;
  
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Fetch recording details
  useEffect(() => {
    const fetchRecording = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/recordings/${recordingId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching recording: ${response.status}`);
        }
        
        const data = await response.json();
        setRecording(data);
      } catch (err) {
        console.error('Failed to fetch recording:', err);
        setError('Failed to load recording data');
      } finally {
        setLoading(false);
      }
    };
    
    if (recordingId) {
      fetchRecording();
    }
  }, [recordingId]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_TRANSCRIPTION':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Pending</span>;
      case 'TRANSCRIBING':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Processing</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'FAILED_TRANSCRIPTION':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Request transcription
  const requestTranscription = async () => {
    if (!recording) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordingId: recording.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request transcription');
      }
      
      // Update recording status
      setRecording(prev => prev ? {
        ...prev,
        status: 'PENDING_TRANSCRIPTION',
        transcription: {
          ...prev.transcription,
          status: 'pending',
          error: undefined
        } as Transcription
      } : null);
      
    } catch (err) {
      console.error('Error requesting transcription:', err);
      setError('Failed to request transcription');
    } finally {
      setLoading(false);
    }
  };

  // Toggle play/pause audio
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real app, you would play/pause the audio here
  };

  // Handle download
  const handleDownload = () => {
    if (!recording) return;
    
    // In a real app, you would handle file download here
    // For now, just simulate opening the file URL
    window.open(`/api/recordings/${recording.id}/download`, '_blank');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/transcriptions" className="mr-3 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-800">
                Recording Details
              </h1>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="large" message="Loading recording..." />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600 text-center">
              {error}
            </div>
          ) : !recording ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recording not found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                The requested recording could not be found or may have been deleted.
              </p>
              <Link 
                href="/recordings" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Recordings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Recording card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {recording.filename}
                      </h2>
                      <div className="mt-1 text-sm text-gray-500">
                        Uploaded on {formatDate(recording.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {renderStatusBadge(recording.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Recording Details</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-gray-500">Duration:</dt>
                        <dd className="text-gray-900 font-medium">{formatDuration(recording.duration)}</dd>
                        
                        <dt className="text-gray-500">File Size:</dt>
                        <dd className="text-gray-900 font-medium">{formatFileSize(recording.filesize)}</dd>
                        
                        <dt className="text-gray-500">Agent:</dt>
                        <dd className="text-gray-900 font-medium">{recording.agent || 'Unassigned'}</dd>
                        
                        <dt className="text-gray-500">Call Type:</dt>
                        <dd className="text-gray-900 font-medium">{recording.callType || 'Unclassified'}</dd>
                        
                        <dt className="text-gray-500">Source:</dt>
                        <dd className="text-gray-900 font-medium">{recording.source === 's3' ? 'S3 Import' : 'Upload'}</dd>
                      </dl>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-md flex flex-col justify-between">
                      <h3 className="text-sm font-medium text-indigo-700 mb-2">Audio Controls</h3>
                      
                      <div className="flex items-center justify-center space-x-4 py-3">
                        <button 
                          onClick={togglePlayPause}
                          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                          disabled={recording.status === 'processing'}
                        >
                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </button>
                        
                        <button 
                          onClick={handleDownload}
                          className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          disabled={recording.status === 'processing'}
                        >
                          <Download className="h-6 w-6" />
                        </button>
                      </div>
                      
                      <div className="mt-3">
                        <div className="h-2 bg-indigo-100 rounded-full">
                          <div className="h-2 bg-indigo-600 rounded-full w-0"></div>
                        </div>
                        <div className="flex justify-between text-xs text-indigo-600 mt-1">
                          <span>0:00</span>
                          <span>{formatDuration(recording.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transcription section */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Transcription
                  </h2>
                  {recording.transcription && recording.transcription.status === 'completed' && (
                    <span className="text-sm text-gray-500">
                      {recording.transcription.speakers} speaker{recording.transcription.speakers !== 1 ? 's' : ''} detected
                    </span>
                  )}
                </div>
                
                {!recording.transcription ? (
                  <div className="text-center py-8">
                    <Volume2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No transcription is available for this recording.</p>
                    <button 
                      onClick={requestTranscription}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      Request Transcription
                    </button>
                  </div>
                ) : recording.transcription.status === 'pending' || recording.transcription.status === 'processing' ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="medium" />
                    <p className="text-gray-500 mt-4">
                      {recording.transcription.status === 'pending' 
                        ? 'Transcription is queued and will begin shortly...' 
                        : 'Transcribing your audio...'}
                    </p>
                  </div>
                ) : recording.transcription.status === 'error' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 mb-2">Transcription failed</p>
                    <p className="text-gray-500 mb-4">{recording.transcription.error || 'An unknown error occurred'}</p>
                    <button 
                      onClick={requestTranscription}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      Retry Transcription
                    </button>
                  </div>
                ) : recording.transcription.status === 'completed' && recording.transcription.text ? (
                  <div>
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700">Transcription Details</h3>
                        <span className="text-xs text-gray-500">
                          {recording.transcription.processingTimeMs 
                            ? `Processed in ${(recording.transcription.processingTimeMs / 1000).toFixed(1)}s` 
                            : ''}
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <dt className="text-gray-500">Language:</dt>
                        <dd className="text-gray-900 font-medium">{recording.transcription.language || 'English'}</dd>
                        
                        <dt className="text-gray-500">Speakers:</dt>
                        <dd className="text-gray-900 font-medium">{recording.transcription.speakers || 1}</dd>
                        
                        <dt className="text-gray-500">Updated:</dt>
                        <dd className="text-gray-900 font-medium">{formatDate(recording.transcription.updatedAt)}</dd>
                      </dl>
                    </div>
                    
                    <div className="mt-4 bg-white border border-gray-100 rounded-md p-4">
                      <div className="prose max-w-none">
                        {recording.transcription.text.split('\n').map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Transcription is available but has no content.</p>
                    <button 
                      onClick={requestTranscription}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      Retry Transcription
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}