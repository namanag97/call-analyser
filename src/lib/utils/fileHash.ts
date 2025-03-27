/**
 * Utilities for generating file hashes used in deduplication
 */
import crypto from 'crypto';

/**
 * Generates a SHA-256 hash from a Buffer
 * 
 * @param buffer The file buffer to hash
 * @returns A hex string representing the SHA-256 hash
 */
export function generateFileHash(buffer: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Generates a hash from a File object
 * 
 * @param file A File object to generate a hash for
 * @returns A Promise resolving to a hex string representing the SHA-256 hash
 */
export async function generateFileHashFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return generateFileHash(buffer);
}

/**
 * Error class for duplicate file uploads
 */
export class DuplicateFileError extends Error {
  originalFile: any;
  
  constructor(message: string, originalFile?: any) {
    super(message);
    this.name = 'DuplicateFileError';
    this.originalFile = originalFile;
  }
} 