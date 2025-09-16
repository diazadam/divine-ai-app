// Correlation ID Middleware for request tracking
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get or generate correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  
  // Attach to request
  req.correlationId = correlationId;
  
  // Set response header
  res.setHeader('X-Correlation-Id', correlationId);
  
  next();
}

export function getCorrelationId(req: Request): string | undefined {
  return req.correlationId;
}