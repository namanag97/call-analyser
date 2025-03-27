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
        { status: 400 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
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
      try {
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
      } catch (findError) {
        console.error('Error finding transcription:', findError);
        return NextResponse.json(
          { error: 'Error finding transcription', details: (findError as Error).message },
          { status: 500 }
        );
      }
    } else {
      // Get all transcriptions
      try {
        // Just use include without explicitly selecting fields
        const transcriptions = await prisma.transcription.findMany({
          include: {
            recording: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        console.log(`Found ${transcriptions.length} transcriptions`);
        
        // Check what we're getting back from the database
        transcriptions.forEach((t, i) => {
          console.log(`Transcription ${i+1}: ID=${t.id}, RecordingID=${t.recordingId}, HasRecording=${!!t.recording}`);
        });
        
        return NextResponse.json({ 
          transcriptions: transcriptions || [],
          count: transcriptions.length
        });
      } catch (dbError) {
        console.error('Database error when fetching transcriptions:', dbError);
        return NextResponse.json(
          { error: 'Database error', details: (dbError as Error).message, transcriptions: [] },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcriptions', details: (error as Error).message, transcriptions: [] },
      { status: 500 }
    );
  }
}