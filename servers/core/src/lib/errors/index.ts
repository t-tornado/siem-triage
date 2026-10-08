export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", context?: Record<string, unknown>) {
    super(404, message, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(400, message, context);
  }
}

export class InternalError extends AppError {
  constructor(
    message = "Internal server error",
    context?: Record<string, unknown>,
  ) {
    super(500, message, context);
  }
}
