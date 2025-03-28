// src/adapters/out/persistence/PrismaRecordingRepository.ts
import { prisma } from '@/lib/prisma';
import { 
  RecordingRepository 
} from '@/core/domain/ports/out/RecordingRepository';
import { 
  GetRecordingsQuery, 
  GetRecordingsResult 
} from '@/core/domain/ports/in/GetRecordingsUseCase';
import { Recording } from '@/core/domain/entities/Recording';
import { Prisma } from '@prisma/client';

export class PrismaRecordingRepository implements RecordingRepository {
  async findAll(query: GetRecordingsQuery): Promise<GetRecordingsResult> {
    try {
      const { page, limit, filter } = query;
      const skip = (page - 1) * limit;
      
      // Build where conditions from filter
      const where: Prisma.RecordingWhereInput = {};
      if (filter) {
        if (filter.agent) {
          where.agent = { contains: filter.agent };
        }
        if (filter.date) {
          const startDate = new Date(filter.date);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(filter.date);
          endDate.setHours(23, 59, 59, 999);
          
          where.createdAt = {
            gte: startDate,
            lte: endDate
          };
        }
        if (filter.status) {
          where.status = filter.status;
        }
        if (filter.source) {
          where.source = filter.source;
        }
      }
      
      // Get total count for pagination
      let totalCount = 0;
      try {
        totalCount = await prisma.recording.count({ where });
      } catch (countError) {
        console.error('Error counting recordings:', countError);
        // Default to 0 if count fails
      }
      
      // Get recordings with pagination
      let recordings = [];
      try {
        recordings = await prisma.recording.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            transcription: true
          }
        });
        
        console.log(`Found ${recordings.length} recordings`);
      } catch (findError) {
        console.error('Error finding recordings:', findError);
        // Return empty array if find fails
      }
      
      return {
        recordings: recordings as unknown as Recording[],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Repository error in findAll:', error);
      // Return empty result on error
      return {
        recordings: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: query.page
      };
    }
  }
  
  async findById(id: string): Promise<Recording | null> {
    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        transcription: true
      }
    });
    
    return recording as unknown as Recording | null;
  }
  
  async save(recording: Omit<Recording, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recording> {
    const createdRecording = await prisma.recording.create({
      data: recording
    });
    
    return createdRecording as unknown as Recording;
  }
  
  async update(id: string, data: Partial<Recording>): Promise<Recording> {
    // Destructure unwanted properties from data object using underscore prefix to show intentional non-use
    const { createdAt: _createdAt, updatedAt: _updatedAt, id: _recordingId, ...updateData } = data;
    
    const updatedRecording = await prisma.recording.update({
      where: { id },
      data: updateData
    });
    
    return updatedRecording as unknown as Recording;
  }

  async delete(id: string): Promise<void> {
    await prisma.recording.delete({
      where: { id }
    });
  }
}