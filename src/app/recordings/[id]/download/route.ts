// src/app/api/recordings/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Fetch recording details
    const recording = await prisma.recording.findUnique({
      where: { id }
    });
    
    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }
    
    // Handle local file
    if (recording.source === 'upload') {
      // Clean the filepath (remove leading slash if present)
      const cleanPath = recording.filepath.startsWith('/') 
        ? recording.filepath.substring(1) 
        : recording.filepath;
      
      const filePath = path.join(process.cwd(), 'public', cleanPath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: 'File not found on server' },
          { status: 404 }
        );
      }
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (recording.filename.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (recording.filename.endsWith('.wav')) contentType = 'audio/wav';
      else if (recording.filename.endsWith('.aac')) contentType = 'audio/aac';
      else if (recording.filename.endsWith('.m4a')) contentType = 'audio/mp4';
      
      // Create response with proper headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${recording.filename}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      });
      
      return response;
    } 
    // Handle S3 file (redirect to S3 URL)
    else if (recording.source === 's3') {
      // In a real implementation, you would generate a presigned URL for S3
      // For now, return an error message
      return NextResponse.json(
        { error: 'S3 downloads not implemented yet' },
        { status: 501 }
      );
    } 
    else {
      return NextResponse.json(
        { error: 'Unsupported file source' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error downloading recording:', error);
    return NextResponse.json(
      { error: 'Error downloading recording' },
      { status: 500 }
    );
  }
}