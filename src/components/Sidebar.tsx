// src/components/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, Play, Cloud, ChevronRight, FileText } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  
  return (
    <div className="w-64 bg-indigo-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-indigo-800">
        <h1 className="text-xl font-bold">Call Analyzer</h1>
        <p className="text-xs text-indigo-300 mt-1">Audio Analysis Service</p>
      </div>
      
      {/* Navigation */}
      <div className="p-4">
        <h2 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">Navigation</h2>
        <ul>
          <li className="mb-2">
            <Link 
              href="/"
              className={`flex items-center w-full p-2 rounded ${
                pathname === '/' ? 'bg-indigo-800' : 'hover:bg-indigo-800'
              }`}
            >
              <Play className="h-4 w-4 mr-2" />
              <span>Recordings</span>
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/transcriptions"
              className={`flex items-center w-full p-2 rounded ${
                pathname === '/transcriptions' ? 'bg-indigo-800' : 'hover:bg-indigo-800'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span>Transcriptions</span>
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/uploads"
              className={`flex items-center w-full p-2 rounded ${
                pathname === '/uploads' ? 'bg-indigo-800' : 'hover:bg-indigo-800'
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Upload</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Upload section */}
      <div className="p-4">
        <h2 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">Upload Options</h2>
        <div className="space-y-3">
          <Link 
            href="/uploads"
            className="block w-full p-2 bg-indigo-700 hover:bg-indigo-600 rounded text-center cursor-pointer transition"
          >
            <span className="flex items-center justify-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio File
            </span>
          </Link>
          
          <Link 
            href="/uploads?source=s3"
            className="flex items-center justify-center w-full p-2 bg-indigo-700 hover:bg-indigo-600 rounded transition"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Import from S3
          </Link>
        </div>
      </div>
      
      {/* Future Features */}
      <div className="mt-auto p-4 border-t border-indigo-800">
        <h2 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">Features</h2>
        <ul className="text-sm text-indigo-300">
          <li className="flex items-center mb-2">
            <ChevronRight className="h-3 w-3 mr-2" />
            <span>Transcription Services</span>
          </li>
          <li className="flex items-center mb-2">
            <ChevronRight className="h-3 w-3 mr-2" />
            <span>Call Sentiment Analysis</span>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 mr-2" />
            <span>Agent Performance Metrics</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;