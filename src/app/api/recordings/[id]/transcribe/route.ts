// src/app/api/recordings/[id]/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/core/domain/errors/AppError';
import { MockElevenLabsAdapter } from '@/adapters/out/transcription/ElevenLabsAdapter';
import { FileStorageRepository } from '@/core/domain/ports/out/FileStorageRepository';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';
import { Prisma } from '@prisma/client';

// Initialize adapters
const transcriptionAdapter = new MockElevenLabsAdapter();
const fileStorageRepository = new LocalFileStorageRepository(
  process.env.UPLOAD_DIR || './public/uploads',
  process.env.BASE_URL || 'http://localhost:3000'
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id;
    
    // Fetch recording to verify it exists
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });
    
    // Check if recording exists
    if (!recording) {
      throw new NotFoundError(`Recording with ID ${recordingId} not found`);
    }
    
    // Get transcription options from request body
    const body = await req.json();
    const { language = 'en', modelId = 'whisper-1', diarize = true } = body;
    
    // Update recording status to TRANSCRIBING
    await prisma.recording.update({
      where: { id: recordingId },
      data: { 
        status: 'TRANSCRIBING'
      },
    });
    
    // Create a new transcription entry or update existing one
    const transcription = await prisma.transcription.upsert({
      where: { recordingId },
      create: {
        recordingId,
        status: 'IN_PROGRESS',
        language,
        modelId,
      },
      update: {
        status: 'IN_PROGRESS',
        language,
        modelId,
      },
    });
    
    // Start transcription in the background
    (async () => {
      try {
        // Get the audio file stream
        const audioStream = await fileStorageRepository.getStream(recording.filepath);
        
        // Transcribe the audio
        const result = await transcriptionAdapter.transcribeAudio(audioStream, {
          language,
          modelId,
          diarize
        });
        
        if (result.success && result.data) {
          // Update transcription with results - cast to any to bypass type checking
          const updateData = {
            status: 'COMPLETED',
            text: result.data.text,
            segments: result.data.segments,  // This will be serialized properly by Prisma
            processingTimeMs: result.data.processingTimeMs,
          };
          
          await prisma.transcription.update({
            where: { id: transcription.id },
            data: updateData as any, // Cast to any to bypass type checking
          });
          
          // Update recording status
          await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'COMPLETED' },
          });
        } else {
          // Update transcription with error
          await prisma.transcription.update({
            where: { id: transcription.id },
            data: {
              status: 'FAILED',
              error: result.error,
            },
          });
          
          // Update recording status
          await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'FAILED_TRANSCRIPTION' },
          });
        }
      } catch (error) {
        console.error('Error in background transcription process:', error);
        
        // Update transcription with error
        await prisma.transcription.update({
          where: { id: transcription.id },
          data: {
            status: 'FAILED',
            error: (error as Error).message,
          },
        });
        
        // Update recording status
        await prisma.recording.update({
          where: { id: recordingId },
          data: { status: 'FAILED_TRANSCRIPTION' },
        });
      }
    })();
    
    // Return the transcription request status immediately
    return NextResponse.json({
      message: 'Transcription started',
      transcriptionId: transcription.id,
      status: transcription.status
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: (error as NotFoundError).message },
        { status: (error as NotFoundError).statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to start transcription process' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id;
    
    // Fetch recording with its transcription
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        transcription: true,
      },
    });
    
    // Check if recording exists
    if (!recording) {
      throw new NotFoundError(`Recording with ID ${recordingId} not found`);
    }
    
    // Return the recording with transcription data
    return NextResponse.json(recording);
  } catch (error) {
    console.error('Error fetching recording details:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: (error as NotFoundError).message },
        { status: (error as NotFoundError).statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch recording details' },
      { status: 500 }
    );
  }
}