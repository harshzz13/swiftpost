import { Request, Response, NextFunction } from 'express';

export interface APIError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error for debugging
  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};