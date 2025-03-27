// src/lib/transcription.ts
import { prisma } from './prisma';
import path from 'path';
import fs from 'fs';
import { RealElevenLabsAdapter } from '@/adapters/out/transcription/ElevenLabsAdapter';
import { LocalFileStorageRepository } from '@/adapters/out/storage/LocalFileStorageRepository';

/**
 * Transcription utility functions
 */

/**
 * Transcribe audio for a recording
 * @param recordingId The ID of the recording to transcribe
 */
export async function transcribeAudio(recordingId: string): Promise<void> {
  console.log(`Starting transcription for recording: ${recordingId}`);
  
  try {
    // Mark transcription as processing
    await prisma.transcription.update({
      where: { recordingId },
      data: { status: 'processing' }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'TRANSCRIBING' }
    });

    // In a real implementation, this would connect to a transcription service
    // For this mock, we'll simulate a delay and then set a success result
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate successful transcription
    const mockTranscriptionText = "This is a mock transcription for testing purposes.";
    
    // Update transcription with results
    await prisma.transcription.update({
      where: { recordingId },
      data: {
        text: mockTranscriptionText,
        status: 'completed',
        processingTimeMs: 1000,
        completedAt: new Date()
      }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'COMPLETED' }
    });

    console.log(`Transcription completed for recording: ${recordingId}`);
  } catch (error) {
    console.error(`Transcription failed for recording: ${recordingId}`, error);
    
    // Update transcription with error
    await prisma.transcription.update({
      where: { recordingId },
      data: {
        status: 'error',
        error: (error as Error).message || 'Unknown error'
      }
    });

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: 'ERROR' }
    });
  }
}