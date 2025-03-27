// src/app/api/recordings/check-duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Handle form data
    const formData = await req.formData();
    const hash = formData.get('hash') as string;
    
    if (!hash) {
      return NextResponse.json(
        { error: 'Content hash is required' },
        { status: 400 }
      );
    }
    
    // Check if a recording with this hash already exists
    const existingRecording = await prisma.recording.findFirst({
      where: {
        contentHash: hash
      }
    });
    
    return NextResponse.json({
      duplicate: !!existingRecording,
      existingRecording: existingRecording ? {
        id: existingRecording.id,
        filename: existingRecording.filename,
        createdAt: existingRecording.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error checking for duplicate recording:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicate' },
      { status: 500 }
    );
  }
}