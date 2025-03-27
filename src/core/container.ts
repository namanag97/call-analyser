import 'reflect-metadata';
import { container } from 'tsyringe';
import { Logger, ConsoleLogger } from './domain/ports/out/Logger';
import { BaseRepository } from './domain/ports/out/BaseRepository';
import { BaseService } from './domain/ports/in/BaseService';

// Register core services
container.registerSingleton<Logger>('Logger', ConsoleLogger);

// Export the container for use in other parts of the application
export { container }; 