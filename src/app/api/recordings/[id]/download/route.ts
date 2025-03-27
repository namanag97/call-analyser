import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/core/domain/errors/AppError';
import * as fs from 'fs';
import * as path from 'path';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';

// Initialize the file storage repository
const fileStorageRepository = new LocalFileStorageRepository(
  process.env.UPLOAD_DIR || './public/uploads',
  process.env.BASE_URL || 'http://localhost:3000'
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id;
    
    // Find the recording
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });
    
    if (!recording) {
      throw new NotFoundError(`Recording with ID ${recordingId} not found`);
    }
    
    // Get the file path
    const filePath = recording.filepath;
    
    // Use the file storage repository to get the file URL
    const fileUrl = fileStorageRepository.getFileUrl(filePath);
    
    // Redirect to the file URL for download
    return NextResponse.redirect(fileUrl);
    
  } catch (error) {
    console.error('Error downloading recording:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: (error as NotFoundError).message },
        { status: (error as NotFoundError).statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to download recording' },
      { status: 500 }
    );
  }
} 