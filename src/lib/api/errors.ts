/**
 * Jarre - API Error Handling
 *
 * Standardized error class, constants, and response helpers for all API routes.
 */

import { NextResponse } from 'next/server';

// ============================================================================
// ERROR CLASS
// ============================================================================

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// FACTORY HELPERS
// ============================================================================

export function unauthorized(): ApiError {
  return new ApiError(401, 'Unauthorized');
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, message);
}

export function forbidden(message: string): ApiError {
  return new ApiError(403, message);
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
