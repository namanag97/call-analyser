// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RecordingFilters from '@/components/RecordingFilters';
import RecordingsList from '@/components/RecordingsList';
import { GetRecordingsResult } from '@/core/domain/ports/in/GetRecordingsUseCase';

export default function HomePage() {
  const [recordings, setRecordings] = useState<GetRecordingsResult>({
    recordings: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    agent?: string;
    date?: string;
  }>({});

  // Fetch recordings when filters or page changes
  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20'
        });
        
        if (filters.agent) {
          params.append('agent', filters.agent);
        }
        
        if (filters.date) {
          params.append('date', filters.date);
        }
        
        const response = await fetch(`/api/recordings?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching recordings: ${response.status}`);
        }
        
        const data = await response.json();
        setRecordings(data);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
        setError('Failed to load recordings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecordings();
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    agent?: string;
    date?: string;
  }) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
              Call Recordings
            </h1>
            
            {/* Filters */}
            <RecordingFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
        
        {/* Recordings list */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading recordings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              {error}
            </div>
          ) : (
            <RecordingsList
              recordings={recordings.recordings}
              totalCount={recordings.totalCount}
              totalPages={recordings.totalPages}
              currentPage={recordings.currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

