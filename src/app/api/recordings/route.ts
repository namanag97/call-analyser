// src/app/api/recordings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RecordingController } from '@/core/controllers/RecordingController';
import { prisma } from '@/lib/prisma';

// Initialize controller
const recordingController = new RecordingController();

export async function GET(req: NextRequest) {
  try {
    // Use the controller to get recordings
    const recordings = await recordingController.getRecordings();
    
    return NextResponse.json({
      recordings,
      count: recordings.length
    });
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return NextResponse.json(
      { 
        error: `Failed to fetch recordings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recordings: []
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Note: We've removed the auth middleware for now as requested
  return recordingController.uploadRecording(req);
}
