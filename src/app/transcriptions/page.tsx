'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Search, Filter, FileText, ExternalLink } from 'lucide-react';

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

export default function TranscriptionsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    agent: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transcription data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to fetch from the transcriptions API
        console.log('Fetching from /api/transcriptions...');
        const response = await fetch('/api/transcriptions');
        
        if (!response.ok) {
          throw new Error(`Error fetching transcriptions: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched transcriptions data:', data);
        
        // Fix for handling API response properly
        if (data && data.transcriptions) {
          // Check if we have valid transcriptions with recording data
          const validTranscriptions = data.transcriptions
            .filter((t: any) => t && t.recording && t.recordingId);
          
          console.log(`Found ${validTranscriptions.length} valid transcriptions with recordings`);
          
          if (validTranscriptions.length > 0) {
            // Map to the expected format for the UI
            const recordingsWithTranscriptions = validTranscriptions.map((transcription: any) => ({
              ...transcription.recording,
              transcription: {
                id: transcription.id,
                recordingId: transcription.recordingId,
                status: transcription.status,
                text: transcription.text,
                language: transcription.language,
                speakers: transcription.speakers,
                processingTimeMs: transcription.processingTimeMs,
                createdAt: transcription.createdAt,
                updatedAt: transcription.updatedAt,
                error: transcription.error
              }
            }));
            
            console.log('Prepared recordings with transcriptions:', recordingsWithTranscriptions);
            setRecordings(recordingsWithTranscriptions);
            return; // Exit early, we have what we need
          } else {
            console.log('No valid transcriptions found with recordings');
          }
        }
          
        // If we get here, we need to try the recordings API
        console.log('Falling back to /api/recordings...');
        const recordingsResponse = await fetch('/api/recordings');
        
        if (!recordingsResponse.ok) {
          throw new Error(`Error fetching recordings: ${recordingsResponse.status}`);
        }
        
        const recordingsData = await recordingsResponse.json();
        console.log('Fetched recordings data:', recordingsData);
        
        // Check if data.recordings exists and is an array
        if (!recordingsData.recordings || !Array.isArray(recordingsData.recordings)) {
          console.error('Invalid response format from recordings API:', recordingsData);
          throw new Error('Invalid response format from API');
        }
        
        // Filter to only include recordings with transcriptions or that have been processed
        const filteredRecordings = recordingsData.recordings.filter((recording: Recording) => 
          recording.transcription || 
          recording.status === 'COMPLETED' || 
          recording.status === 'PENDING_TRANSCRIPTION' || 
          recording.status === 'TRANSCRIBING'
        );
        
        console.log('Filtered recordings from recordings API:', filteredRecordings);
        setRecordings(filteredRecordings);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load transcription data');
        setRecordings([]); // Set empty array on error so UI shows proper message
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply search and filters to recordings
  const filteredRecordings = recordings.filter(recording => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      recording.filename.toLowerCase().includes(searchLower) ||
      (recording.agent && recording.agent.toLowerCase().includes(searchLower)) ||
      (recording.callType && recording.callType.toLowerCase().includes(searchLower)) ||
      (recording.transcription?.text && recording.transcription.text.toLowerCase().includes(searchLower));
    
    // Agent filter
    const matchesAgent = filters.agent === '' || 
      (recording.agent && recording.agent.toLowerCase().includes(filters.agent.toLowerCase()));
    
    // Status filter
    const matchesStatus = filters.status === '' || recording.status === filters.status;
    
    // Date filters
    let matchesDate = true;
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const recordingDate = new Date(recording.createdAt);
      if (recordingDate < fromDate) {
        matchesDate = false;
      }
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      const recordingDate = new Date(recording.createdAt);
      if (recordingDate > toDate) {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesAgent && matchesStatus && matchesDate;
  });

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

  // Render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_TRANSCRIPTION':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'TRANSCRIBING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED_TRANSCRIPTION':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Calculate transcription completion percentage
  const getTranscriptionPercentage = (recording: Recording) => {
    if (!recording.transcription) return 0;
    
    switch (recording.status) {
      case 'COMPLETED':
        return 100;
      case 'TRANSCRIBING':
        // For simplicity, return 50% for in-progress, but in a real app you'd track actual progress
        return 50;
      case 'PENDING_TRANSCRIPTION':
        return 10;
      default:
        return 0;
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    setFilters({
      agent: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchTerm('');
  };

  // Handle transcription request
  const requestTranscription = async (recordingId: string) => {
    try {
      const response = await fetch(`/api/transcriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to request transcription');
      }

      // Update the recording in the list
      const updatedRecording = await response.json();
      setRecordings(prevRecordings => 
        prevRecordings.map(rec => 
          rec.id === recordingId ? { ...rec, status: 'PENDING_TRANSCRIPTION' } : rec
        )
      );
    } catch (err) {
      console.error('Error requesting transcription:', err);
    }
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
            <h1 className="text-xl font-semibold text-gray-800">
              Transcriptions
            </h1>
            
            {/* Search and filter */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transcriptions..." 
                  className="w-56 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                />
                <Search className="absolute right-2 top-1.5 h-5 w-5 text-gray-400" />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>
          </div>
          
          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <input
                    type="text"
                    value={filters.agent}
                    onChange={(e) => setFilters({...filters, agent: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    placeholder="Filter by agent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING_TRANSCRIPTION">Pending</option>
                    <option value="TRANSCRIBING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED_TRANSCRIPTION">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 mr-2"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="large" message="Loading transcriptions..." />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600 text-center">
              {error}
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transcriptions found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {searchTerm || filters.agent || filters.status || filters.dateFrom || filters.dateTo ? 
                  'No transcriptions match your search criteria. Try adjusting your filters.' :
                  'Upload audio recordings and request transcriptions to see them here.'}
              </p>
              <Link 
                href="/uploads" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Upload Recordings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRecordings.map(recording => (
                <div 
                  key={recording.id} 
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          {recording.filename}
                          <Link href={`/recordings/${recording.id}`} className="ml-2 text-indigo-600 hover:text-indigo-800">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="mr-4">{recording.agent || 'Unassigned'}</span>
                          <span className="mr-4">{formatDate(recording.createdAt)}</span>
                          <span>{formatDuration(recording.duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {renderStatusIcon(recording.status)}
                        <div className="ml-2">
                          {renderStatusBadge(recording.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div 
                        className={`h-2.5 rounded-full ${
                          recording.status === 'COMPLETED' ? 'bg-green-500' : 
                          recording.status === 'FAILED_TRANSCRIPTION' ? 'bg-red-500' : 
                          'bg-blue-500'
                        }`} 
                        style={{ width: `${getTranscriptionPercentage(recording)}%` }}
                      ></div>
                    </div>
                    
                    {/* Transcription preview or status */}
                    {recording.transcription?.status === 'COMPLETED' ? (
                      <div className="text-sm text-gray-700 border-t border-gray-100 pt-3">
                        <div className="mb-2 flex justify-between">
                          <div className="font-medium">Transcription Preview:</div>
                          <div className="text-xs text-gray-500">
                            {recording.transcription.speakers} speaker{recording.transcription.speakers !== 1 ? 's' : ''} • 
                            {recording.transcription.processingTimeMs ? 
                              ` Processed in ${(recording.transcription.processingTimeMs / 1000).toFixed(1)}s` : 
                              ''}
                          </div>
                        </div>
                        <div className="line-clamp-2 text-gray-600">
                          {recording.transcription.text || 'No text content available'}
                        </div>
                        <div className="mt-2 text-right">
                          <Link 
                            href={`/recordings/${recording.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            View full transcription
                          </Link>
                        </div>
                      </div>
                    ) : recording.status === 'FAILED_TRANSCRIPTION' ? (
                      <div className="text-sm text-red-600 border-t border-gray-100 pt-3">
                        <div className="font-medium mb-1">Transcription failed:</div>
                        <div>{recording.transcription?.error || 'Unknown error'}</div>
                        <div className="mt-2 text-right">
                          <button 
                            onClick={() => requestTranscription(recording.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Retry transcription
                          </button>
                        </div>
                      </div>
                    ) : recording.status === 'TRANSCRIBING' ? (
                      <div className="text-sm text-gray-600 border-t border-gray-100 pt-3 flex items-center">
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Transcription in progress...</span>
                      </div>
                    ) : recording.status === 'PENDING_TRANSCRIPTION' ? (
                      <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                        <span>Queued for transcription...</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 border-t border-gray-100 pt-3">
                        <button 
                          onClick={() => requestTranscription(recording.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Request transcription
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}