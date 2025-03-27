// src/core/application/jobs/TranscriptionJobHandler.ts
import { prisma } from '@/lib/prisma';
import { RealElevenLabsAdapter } from '@/adapters/out/transcription/ElevenLabsAdapter';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';
import path from 'path';

// Define job data interface
interface TranscriptionJobData {
  recordingId: string;
  transcriptionId: string;
  userId?: string; // Optional: User who triggered the transcription
}

/**
 * Handles transcription jobs.
 * This function is called by the worker to process transcription jobs.
 */
export async function handleTranscriptionJob(data: TranscriptionJobData) {
  const { recordingId, transcriptionId } = data;
  
  console.log(`Starting transcription job for recording ${recordingId}`);
  
  // Initialize our adapters
  const elevenLabsAdapter = new RealElevenLabsAdapter();
  const fileStorageRepository = new LocalFileStorageRepository(
    path.join(process.cwd(), 'public', 'uploads'),
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  );
  
  try {
    // Update status to IN_PROGRESS
    await prisma.$transaction([
      prisma.transcription.update({
        where: { id: transcriptionId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      }),
      prisma.recording.update({
        where: { id: recordingId },
        data: {
          status: 'TRANSCRIBING',
        },
      }),
    ]);
    
    // Fetch recording details
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
    });
    
    if (!recording) {
      throw new Error(`Recording with ID ${recordingId} not found`);
    }
    
    console.log(`Fetched recording: ${recording.filename}, path: ${recording.filepath}`);
    
    // Get audio stream from storage
    const audioStream = await fileStorageRepository.getStream(recording.filepath);
    
    console.log('Getting audio stream for transcription...');
    
    // Call ElevenLabs to transcribe the audio
    const transcriptionResult = await elevenLabsAdapter.transcribeAudio(
      audioStream,
      {
        language: 'en', // Default language - could be configurable
        modelId: 'scribe_v1', // Default model - could be configurable
        diarize: true, // Enable speaker diarization
      }
    );
    
    // Handle successful transcription
    if (transcriptionResult.success && transcriptionResult.data) {
      const { text, segments, processingTimeMs } = transcriptionResult.data;
      
      // Calculate speaker count from segments
      const speakerCount = new Set(segments.map(segment => segment.speaker)).size;
      
      console.log(`Transcription successful: ${speakerCount} speakers, ${segments.length} segments`);
      
      // Update transcription with results
      await prisma.transcription.update({
        where: { id: transcriptionId },
        data: {
          status: 'COMPLETED',
          text,
          segments,
          processingTimeMs,
          speakers: speakerCount,
          updatedAt: new Date(),
        },
      });
      
      // Update recording status
      await prisma.recording.update({
        where: { id: recordingId },
        data: {
          status: 'COMPLETED',
        },
      });
      
      return {
        success: true,
        recordingId,
        transcriptionId,
        speakerCount,
        segments: segments.length,
      };
    } else {
      // Handle failed transcription
      const errorMessage = transcriptionResult.error || 'Unknown transcription error';
      console.error(`Transcription failed: ${errorMessage}`);
      
      // Update transcription and recording with failure status
      await prisma.$transaction([
        prisma.transcription.update({
          where: { id: transcriptionId },
          data: {
            status: 'FAILED',
            error: errorMessage,
            updatedAt: new Date(),
          },
        }),
        prisma.recording.update({
          where: { id: recordingId },
          data: {
            status: 'FAILED_TRANSCRIPTION',
          },
        }),
      ]);
      
      return {
        success: false,
        recordingId,
        transcriptionId,
        error: errorMessage,
      };
    }
    
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = (error as Error).message || 'Unknown error during transcription process';
    console.error(`Transcription job error:`, error);
    
    // Update transcription and recording with failure status
    try {
      await prisma.$transaction([
        prisma.transcription.update({
          where: { id: transcriptionId },
          data: {
            status: 'FAILED',
            error: errorMessage,
            updatedAt: new Date(),
          },
        }),
        prisma.recording.update({
          where: { id: recordingId },
          data: {
            status: 'FAILED_TRANSCRIPTION',
          },
        }),
      ]);
    } catch (dbError) {
      console.error('Failed to update status after error:', dbError);
    }
    
    // Re-throw the error to mark the job as failed
    throw error;
  }
}