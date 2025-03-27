/**
 * Base class for application errors
 */
export class AppError extends Error {
  statusCode: number = 500;

  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Error for when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Error for unauthorized access
 */
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

/**
 * Error for forbidden actions
 */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

/**
 * Error for database operations
 */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
} 