// src/lib/transcription.ts
import { prisma } from './prisma';
import path from 'path';
import fs from 'fs';
import { RealElevenLabsAdapter } from '@/adapters/out/transcription/ElevenLabsAdapter';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';

/**
 * Transcribes an audio file and updates the transcription record in the database.
 * 
 * @param recordingId The ID of the recording to transcribe
 * @returns A promise that resolves when the transcription is complete
 */
export async function transcribeAudio(recordingId: string): Promise<void> {
  try {
    // Update status to processing
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'TRANSCRIBING' }
    });

    await prisma.transcription.update({
      where: { recordingId },
      data: { 
        status: 'processing',
        error: null
      }
    });

    // Get recording details
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId }
    });

    if (!recording) {
      throw new Error(`Recording with ID ${recordingId} not found`);
    }

    // Initialize the file storage repository
    const fileStorageRepository = new LocalFileStorageRepository(
      path.join(process.cwd(), 'public', 'uploads'),
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );

    // Get file stream from storage
    const audioStream = await fileStorageRepository.getStream(recording.filepath);

    // Initialize ElevenLabs adapter
    const transcriptionAdapter = new RealElevenLabsAdapter();

    // Record start time for performance measurement
    const startTime = Date.now();

    // Transcribe audio
    const transcriptionResult = await transcriptionAdapter.transcribeAudio(
      audioStream,
      {
        modelId: 'scribe_v1',
        language: 'en',
        diarize: true
      }
    );

    if (!transcriptionResult.success || !transcriptionResult.data) {
      throw new Error(transcriptionResult.error || 'Transcription failed');
    }

    // Calculate speaker count from segments
    const speakers = new Set(
      transcriptionResult.data.segments.map(segment => segment.speaker)
    ).size;

    // Update transcription record
    await prisma.transcription.update({
      where: { recordingId },
      data: {
        status: 'completed',
        text: transcriptionResult.data.text,
        speakers,
        processingTimeMs: transcriptionResult.data.processingTimeMs,
        segments: transcriptionResult.data.segments as any,
        updatedAt: new Date()
      }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'COMPLETED' }
    });

    console.log(`Transcription completed for recording ${recordingId}`);
  } catch (error) {
    console.error(`Error transcribing recording ${recordingId}:`, error);

    // Update transcription status to error
    await prisma.transcription.update({
      where: { recordingId },
      data: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date()
      }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'FAILED_TRANSCRIPTION' }
    });

    // Re-throw error for handling by caller
    throw error;
  }
}