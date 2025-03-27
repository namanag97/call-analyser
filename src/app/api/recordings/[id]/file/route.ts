// src/app/api/recordings/[id]/file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/core/domain/errors/AppError';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const statAsync = promisify(fs.stat);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id;
    
    // Fetch recording to get file path
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: {
        filepath: true,
        filename: true,
        filesize: true,
      },
    });
    
    // Check if recording exists
    if (!recording) {
      throw new NotFoundError(`Recording with ID ${recordingId} not found`);
    }
    
    // Determine the file path
    // Remove any leading slash from storagePath to avoid path resolution issues
    const storagePath = recording.filepath.startsWith('/') 
      ? recording.filepath.slice(1) 
      : recording.filepath;
    
    // Calculate absolute file path
    const absolutePath = path.join(process.cwd(), 'public', storagePath);
    
    // Check if file exists
    try {
      await statAsync(absolutePath);
    } catch (error) {
      console.error('File not found:', error);
      throw new NotFoundError(`File for recording ${recordingId} not found`);
    }
    
    // Determine content type based on file extension
    const ext = path.extname(recording.filename).toLowerCase();
    let contentType = 'audio/mpeg'; // Default
    
    // Set proper content type based on file extension
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.aac':
        contentType = 'audio/aac';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.ogg':
        contentType = 'audio/ogg';
        break;
      // Add more audio types as needed
    }
    
    // Get file stats for content length
    const stats = await statAsync(absolutePath);
    
    // Create file read stream
    const fileStream = fs.createReadStream(absolutePath);
    
    // Create response headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
    
    // Create and return response with audio stream
    return new NextResponse(fileStream as any, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to serve audio file' },
      { status: 500 }
    );
  }
}