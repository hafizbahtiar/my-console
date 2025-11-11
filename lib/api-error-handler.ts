/**
 * Standardized API Error Handling
 * Provides consistent error responses and logging for API routes
 */

import { NextResponse } from 'next/server';
import { logger, LogLevel } from './logger';

export enum APIErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: APIErrorCode;
    message: string;
    details?: any;
    requestId?: string;
  };
}

export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: APIErrorCode,
  message: string,
  status: number = 500,
  details?: any,
  requestId?: string
): NextResponse<APIErrorResponse> {
  const response: APIErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(requestId && { requestId }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<APISuccessResponse<T>> {
  const response: APISuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Handle API errors with logging and standardized responses
 */
export function handleAPIError(
  error: unknown,
  context: string,
  requestId?: string
): NextResponse<APIErrorResponse> {
  // Handle known error types
  if (error instanceof APIError) {
    logger.error(
      `API Error in ${context}`,
      context,
      error.originalError,
      {
        code: error.code,
        status: error.status,
        requestId,
      }
    );

    return createErrorResponse(
      error.code,
      error.message,
      error.status,
      error.details,
      requestId
    );
  }

  // Handle Appwrite errors
  if (error && typeof error === 'object' && 'code' in error) {
    const appwriteError = error as any;
    const status = appwriteError.code || 500;
    const message = appwriteError.message || 'An error occurred';

    let apiCode: APIErrorCode;
    if (status === 401) {
      apiCode = APIErrorCode.UNAUTHORIZED;
    } else if (status === 403) {
      apiCode = APIErrorCode.FORBIDDEN;
    } else if (status === 404) {
      apiCode = APIErrorCode.NOT_FOUND;
    } else if (status === 409) {
      apiCode = APIErrorCode.CONFLICT;
    } else if (status === 422) {
      apiCode = APIErrorCode.VALIDATION_ERROR;
    } else if (status === 413) {
      apiCode = APIErrorCode.PAYLOAD_TOO_LARGE;
    } else if (status === 429) {
      apiCode = APIErrorCode.TOO_MANY_REQUESTS;
    } else if (status >= 500) {
      apiCode = APIErrorCode.INTERNAL_SERVER_ERROR;
    } else {
      apiCode = APIErrorCode.BAD_REQUEST;
    }

    logger.error(
      `API Error in ${context}`,
      context,
      error,
      {
        code: apiCode,
        status,
        requestId,
      }
    );

    return createErrorResponse(apiCode, message, status, undefined, requestId);
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  logger.error(
    `Unexpected error in ${context}`,
    context,
    error,
    { requestId }
  );

  return createErrorResponse(
    APIErrorCode.INTERNAL_SERVER_ERROR,
    'An internal server error occurred',
    500,
    undefined,
    requestId
  );
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    message: string,
    public status: number = 500,
    public details?: any,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  static badRequest(message: string, details?: any): APIError {
    return new APIError(APIErrorCode.BAD_REQUEST, message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): APIError {
    return new APIError(APIErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message: string = 'Forbidden'): APIError {
    return new APIError(APIErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(message: string = 'Resource not found'): APIError {
    return new APIError(APIErrorCode.NOT_FOUND, message, 404);
  }

  static conflict(message: string, details?: any): APIError {
    return new APIError(APIErrorCode.CONFLICT, message, 409, details);
  }

  static validationError(message: string, details?: any): APIError {
    return new APIError(APIErrorCode.VALIDATION_ERROR, message, 422, details);
  }

  static payloadTooLarge(message: string = 'Request payload too large'): APIError {
    return new APIError(APIErrorCode.PAYLOAD_TOO_LARGE, message, 413);
  }

  static internalServerError(message: string = 'Internal server error', originalError?: unknown): APIError {
    return new APIError(APIErrorCode.INTERNAL_SERVER_ERROR, message, 500, undefined, originalError);
  }
}

/**
 * Generate request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

