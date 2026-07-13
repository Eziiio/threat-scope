import ErrorResponse from '../utils/errorResponse.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for developer debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Intercepted]', err);
  }

  // 1. Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid field format: ${err.path}`;
    error = new ErrorResponse(message, 404);
  }

  // 2. Mongoose Duplicate Key Error (Mongo Error Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate entry. The field '${field}' already has a registered value: '${value}'`;
    error = new ErrorResponse(message, 400);
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = new ErrorResponse('Validation Failed', 400, formattedErrors);
  }

  // 4. JWT Bad Signature Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Authentication failed. JSON Web Token is invalid.';
    error = new ErrorResponse(message, 401);
  }

  // 5. JWT Expiration Error
  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication failed. JSON Web Token has expired.';
    error = new ErrorResponse(message, 401);
  }

  // Fallback defaults
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
