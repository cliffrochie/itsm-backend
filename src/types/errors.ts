export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: Record<string, string[]> | null;

  constructor(message: string, statusCode = 500, errors: Record<string, string[]> | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthenticated.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed.", errors: Record<string, string[]>) {
    super(message, 422, errors);
  }
}
