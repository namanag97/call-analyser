// src/app/api/transcriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/core/domain/errors/AppError';
import { transcribeAudio } from '@/lib/transcription';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordingId, language = 'en', modelId = 'scribe_v1', diarize = true } = body;
    
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
    
    // Create or update transcription record
    const transcription = await prisma.transcription.upsert({
      where: { 
        recordingId 
      },
      update: { 
        status: 'pending',
        error: null
      },
      create: {
        recordingId,
        status: 'pending',
        language: language || 'en'
      }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'PENDING_TRANSCRIPTION' }
    });

    // Start transcription process in the background
    // This is non-blocking, allowing the API to return immediately
    transcribeAudio(recordingId).catch(error => {
      console.error(`Error transcribing recording ${recordingId}:`, error);
    });

    return NextResponse.json({ success: true, transcription });
  } catch (error) {
    console.error('Error processing transcription request:', error);
    
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const recordingId = searchParams.get('recordingId');

    if (recordingId) {
      // Get specific transcription
      const transcription = await prisma.transcription.findUnique({
        where: { recordingId }
      });

      if (!transcription) {
        return NextResponse.json(
          { error: 'Transcription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(transcription);
    } else {
      // Get all transcriptions
      const transcriptions = await prisma.transcription.findMany({
        include: {
          recording: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return NextResponse.json({ transcriptions });
    }
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcriptions' },
      { status: 500 }
    );
  }
}