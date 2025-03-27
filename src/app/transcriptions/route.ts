// src/app/api/transcriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transcribeAudio } from '@/lib/transcription';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { recordingId } = data;

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' },
        { status: 400 }
      );
    }

    // Check if recording exists
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: { transcription: true }
    });

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Check if transcription already exists and is not in a failed state
    if (
      recording.transcription && 
      recording.transcription.status !== 'error'
    ) {
      return NextResponse.json(
        { 
          error: 'Transcription already exists for this recording', 
          status: recording.transcription.status 
        },
        { status: 400 }
      );
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
        language: 'en'
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
    return NextResponse.json(
      { error: 'Failed to process transcription request' },
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