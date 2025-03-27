 // src/components/RecordingFilters.tsx
import React, { useState } from 'react';
import { Filter, Calendar, User, Search } from 'lucide-react';

interface RecordingFiltersProps {
  onFilterChange: (filters: {
    agent?: string;
    date?: string;
  }) => void;
}

const RecordingFilters: React.FC<RecordingFiltersProps> = ({ onFilterChange }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      agent: agentFilter || undefined,
      date: dateFilter || undefined,
    });
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setDateFilter('');
    setAgentFilter('');
    onFilterChange({});
  };

  return (
    <div>
      <div className="flex items-center">
        <button 
          className="flex items-center text-gray-600 hover:text-gray-900 mr-3"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter className="h-4 w-4 mr-1" />
          <span>Filters</span>
        </button>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..."
            className="rounded-lg border border-gray-300 py-1 px-3 text-sm"
            onChange={(e) => onFilterChange({ ...{ agent: agentFilter, date: dateFilter }, agent: e.target.value || undefined })}
          />
          <Search className="h-4 w-4 absolute right-2 top-1.5 text-gray-400" />
        </div>
      </div>
      
      {/* Filter panel */}
      {filterOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline-block mr-1" />
              Date Filter
            </label>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-3 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline-block mr-1" />
              Agent
            </label>
            <input 
              type="text" 
              placeholder="Filter by agent name"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-1.5 px-3 text-sm"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <button 
              className="text-sm text-gray-600 hover:text-gray-900 mr-4"
              onClick={handleClearFilters}
            >
              Clear All
            </button>
            <button 
              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingFilters;