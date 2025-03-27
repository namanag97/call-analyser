import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/core/domain/errors/AppError';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordingId, language = 'en', modelId = 'whisper-1', diarize = true } = body;
    
    // Validate required fields
    if (!recordingId) {
      throw new ValidationError('Recording ID is required');
    }
    
    // Find the recording
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });
    
    if (!recording) {
      throw new NotFoundError(`Recording with ID ${recordingId} not found`);
    }
    
    // Redirect to the transcribe endpoint for the specific recording
    // This will use the existing transcribe route logic
    const response = await fetch(`${req.nextUrl.origin}/api/recordings/${recordingId}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, modelId, diarize }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe recording');
    }
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in transcription request:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 