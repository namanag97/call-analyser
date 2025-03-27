// File storage adapter fix
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
    try {
      // Generate a unique filename to prevent collisions
      const uniqueFilename = `${Date.now()}-${filename}`;
      const relativePath = `/uploads/${uniqueFilename}`;
      const absolutePath = path.join(process.cwd(), 'public', 'uploads', uniqueFilename);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(absolutePath));
      
      // Convert Buffer to Uint8Array for TypeScript compatibility
      const uint8Array = new Uint8Array(buffer);
      await writeFileAsync(absolutePath, uint8Array);
      
      // Return the relative path for storage in the database
      return relativePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  getFileUrl(filepath: string): string {
    return `${this.baseUrl}${filepath}`;
  }
}