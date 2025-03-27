// src/components/RecordingsList.tsx
import React, { useState } from 'react';
import { Play, Pause, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Recording } from '@/core/domain/entities/Recording';

interface RecordingsListProps {
  recordings: Recording[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  totalCount,
  totalPages,
  currentPage,
  onPageChange
}) => {
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const recordingsPerPage = 20;

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Toggle play/pause for a recording
  const togglePlayPause = (id: string) => {
    if (isPlayingId === id) {
      setIsPlayingId(null);
    } else {
      setIsPlayingId(id);
    }
  };

  // Render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div>
      {recordings.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No recordings match your search criteria
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recordings.map(recording => (
                  <tr key={recording.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{recording.filename}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{recording.agent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(recording.createdAt.toString())}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recording.duration || '0:00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(recording.filesize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        recording.source === 's3' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {recording.source === 's3' ? 'S3' : 'Upload'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderStatusIcon(recording.status)}
                        <span className="ml-2 text-sm capitalize text-gray-700">
                          {recording.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => togglePlayPause(recording.id)}
                          className={`text-gray-600 hover:text-gray-900`}
                          disabled={recording.status === 'processing'}
                        >
                          {isPlayingId === recording.id ? 
                            <Pause className="h-5 w-5" /> : 
                            <Play className="h-5 w-5" />
                          }
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          disabled={recording.status === 'processing'}
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * recordingsPerPage + 1}</span> to <span className="font-medium">
                  {Math.min(currentPage * recordingsPerPage, totalCount)}
                </span> of <span className="font-medium">{totalCount}</span> recordings
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 border-gray-200' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 border-gray-200' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecordingsList;