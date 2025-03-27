// src/lib/transcription.ts
import { prisma } from './prisma';
import path from 'path';
import fs from 'fs';
import { ElevenLabsClient } from '@/lib/elevenlabs-client';

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

    // Get the file path
    const filePath = path.join(process.cwd(), 'public', recording.filepath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Create ElevenLabs client
    const client = new ElevenLabsClient();

    // Record start time for performance measurement
    const startTime = Date.now();

    // Transcribe audio
    const transcriptionResult = await client.transcribe({
      audioData: fileBuffer,
      fileName: recording.filename,
      modelId: 'scribe_v1',
      languageCode: 'en', // Default to English
      diarize: true // Enable speaker diarization
    });

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;

    // Extract speaker information
    const speakers = new Set();
    if (transcriptionResult.segments) {
      transcriptionResult.segments.forEach(segment => {
        if (segment.speaker) {
          speakers.add(segment.speaker);
        }
      });
    }

    // Update transcription record
    await prisma.transcription.update({
      where: { recordingId },
      data: {
        status: 'completed',
        text: transcriptionResult.text,
        speakers: speakers.size,
        processingTimeMs,
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