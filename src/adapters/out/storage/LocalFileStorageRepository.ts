// src/adapters/out/storage/LocalFileStorageRepository.ts
import { FileStorageRepository } from '@/core/domain/ports/out/FileStorageRepository';
import { NotFoundError } from '@/core/domain/errors/AppError';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);

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

  /**
   * Get a readable stream for a file
   * @param storagePath The relative storage path (e.g. /uploads/file.mp3)
   * @returns A readable stream for the file
   */
  async getStream(storagePath: string): Promise<NodeJS.ReadableStream> {
    try {
      // Calculate the absolute path based on the storage path
      // Remove any leading slash from storagePath to avoid path resolution issues
      const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
      
      // Determine the absolute file path
      // If storagePath is stored as /uploads/file.mp3, we need to resolve it relative to public directory
      const absolutePath = path.join(process.cwd(), 'public', cleanPath);
      
      // Check if file exists
      try {
        await statAsync(absolutePath);
      } catch (error) {
        throw new NotFoundError(`File not found at path: ${storagePath}`);
      }
      
      // Create and return a read stream
      return fs.createReadStream(absolutePath);
    } catch (error) {
      console.error('Error creating file stream:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to create stream for file: ${storagePath}`);
    }
  }
}