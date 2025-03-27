/**
 * Recording Controller
 * Handles API requests for recordings
 */

import { Recording } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class RecordingController {
  /**
   * Get all recordings
   */
  async getRecordings(): Promise<Recording[]> {
    return await prisma.recording.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a recording by ID
   */
  async getRecording(id: string): Promise<Recording | null> {
    return await prisma.recording.findUnique({
      where: { id }
    });
  }

  /**
   * Update a recording
   */
  async updateRecording(id: string, data: Partial<Recording>): Promise<Recording> {
    return await prisma.recording.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a recording
   */
  async deleteRecording(id: string): Promise<Recording> {
    return await prisma.recording.delete({
      where: { id }
    });
  }
} 