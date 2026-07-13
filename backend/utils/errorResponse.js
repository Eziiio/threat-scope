class ErrorResponse extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;
