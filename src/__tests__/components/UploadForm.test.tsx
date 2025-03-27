// src/__tests__/components/UploadForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadForm from '@/components/UploadForm';
import { generateFileHashFromFile } from '@/lib/utils/fileHash';

// Mock the react-dropzone hook
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn().mockImplementation(({ onDrop }) => ({
    getRootProps: jest.fn().mockReturnValue({
      onClick: jest.fn(),
    }),
    getInputProps: jest.fn().mockReturnValue({}),
    isDragActive: false,
    open: jest.fn(),
    onDrop,
  })),
}));

// Mock file hash utility
jest.mock('@/lib/utils/fileHash', () => ({
  generateFileHashFromFile: jest.fn().mockResolvedValue('mocked-hash'),
}));

describe('UploadForm', () => {
  // Mocked handlers
  const mockOnUpload = jest.fn().mockResolvedValue(undefined);
  const mockOnS3Import = jest.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for the duplicate check
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ duplicate: false })
    });
  });
  
  it('should render upload dropzone', () => {
    // Arrange & Act
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Assert
    expect(screen.getByText(/drag and drop audio files here/i)).toBeInTheDocument();
    expect(screen.getByText(/browse files/i)).toBeInTheDocument();
  });
  
  it('should render S3 import section', () => {
    // Arrange & Act
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Assert
    expect(screen.getByText(/import from s3/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter s3 object key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
  });
  
  it('should enable S3 import button when a key is entered', () => {
    // Arrange
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    const input = screen.getByPlaceholderText(/enter s3 object key/i);
    const button = screen.getByRole('button', { name: /import/i });
    
    // Act
    fireEvent.change(input, { target: { value: 's3-key' } });
    
    // Assert
    expect(button).not.toBeDisabled();
  });
  
  it('should call onS3Import when the import button is clicked', async () => {
    // Arrange
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    const input = screen.getByPlaceholderText(/enter s3 object key/i);
    const button = screen.getByRole('button', { name: /import/i });
    
    // Act
    fireEvent.change(input, { target: { value: 's3-key' } });
    fireEvent.click(button);
    
    // Assert
    await waitFor(() => {
      expect(mockOnS3Import).toHaveBeenCalledWith('s3-key');
    });
  });
  
  it('should handle file drop and check for duplicates', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const { container } = render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Get the mocked onDrop from useDropzone
    const { useDropzone } = require('react-dropzone');
    const onDrop = useDropzone.mock.calls[0][0].onDrop;
    
    // Act
    await onDrop([mockFile]);
    
    // Assert
    expect(generateFileHashFromFile).toHaveBeenCalledWith(mockFile);
    expect(global.fetch).toHaveBeenCalled();
    expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
  });
  
  it('should handle duplicate files', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    
    // Mock fetch to return that the file is a duplicate
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ duplicate: true })
    });
    
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Get the mocked onDrop from useDropzone
    const { useDropzone } = require('react-dropzone');
    const onDrop = useDropzone.mock.calls[0][0].onDrop;
    
    // Act
    await onDrop([mockFile]);
    
    // Assert
    expect(generateFileHashFromFile).toHaveBeenCalledWith(mockFile);
    expect(global.fetch).toHaveBeenCalled();
    expect(mockOnUpload).not.toHaveBeenCalled(); // Should not call onUpload for duplicates
    
    // Check for duplicate warning (it's rendered asynchronously, so we need to wait)
    await waitFor(() => {
      expect(screen.getByText(/file already exists/i)).toBeInTheDocument();
    });
  });
  
  it('should handle batch uploads', async () => {
    // Arrange
    const mockFile1 = new File(['test1'], 'test1.mp3', { type: 'audio/mpeg' });
    const mockFile2 = new File(['test2'], 'test2.mp3', { type: 'audio/mpeg' });
    
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Get the mocked onDrop from useDropzone
    const { useDropzone } = require('react-dropzone');
    const onDrop = useDropzone.mock.calls[0][0].onDrop;
    
    // Act
    await onDrop([mockFile1, mockFile2]);
    
    // Assert
    expect(generateFileHashFromFile).toHaveBeenCalledTimes(2);
    expect(mockOnUpload).toHaveBeenCalledTimes(2);
    
    // Check for batch progress indicator
    await waitFor(() => {
      expect(screen.getByText(/batch upload progress/i)).toBeInTheDocument();
    });
  });
  
  it('should handle upload errors', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const errorMessage = 'Upload failed';
    mockOnUpload.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<UploadForm onUpload={mockOnUpload} onS3Import={mockOnS3Import} />);
    
    // Get the mocked onDrop from useDropzone
    const { useDropzone } = require('react-dropzone');
    const onDrop = useDropzone.mock.calls[0][0].onDrop;
    
    // Act
    await onDrop([mockFile]);
    
    // Assert
    expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
    
    // Check for error message (it's rendered asynchronously)
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});