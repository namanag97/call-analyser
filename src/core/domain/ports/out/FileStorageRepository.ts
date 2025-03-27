
// src/core/domain/ports/out/FileStorageRepository.ts
export interface FileStorageRepository {
    saveFile(filename: string, buffer: Buffer): Promise<string>; // Returns filepath
    getFileUrl(filepath: string): string;
  }