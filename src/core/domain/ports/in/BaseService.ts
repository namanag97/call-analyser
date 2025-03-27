import { injectable } from 'tsyringe';
import { PaginatedResult } from '../out/BaseRepository';

@injectable()
export interface BaseService<T> {
  getById(id: string): Promise<T | null>;
  getAll(page?: number, limit?: number): Promise<PaginatedResult<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
} 