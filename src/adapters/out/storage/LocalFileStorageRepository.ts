// src/adapters/out/storage/LocalFileStorageRepository.ts
import { FileStorageRepository } from '@/core/domain/ports/out/FileStorageRepository';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

export class LocalFileStorageRepository implements FileStorageRepository {
  constructor(private basePath: string, private baseUrl: string) {
    // Ensure the upload directory exists
    this.ensureDirectoryExists(basePath);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdirAsync(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    // Generate a unique filename to prevent collisions
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filepath = path.join(this.basePath, uniqueFilename);
    
    // Write the file to disk
    await writeFileAsync(filepath, buffer);
    
    // Return the relative path for storage in the database
    return `/uploads/${uniqueFilename}`;
  }

  getFileUrl(filepath: string): string {
    return `${this.baseUrl}${filepath}`;
  }
}