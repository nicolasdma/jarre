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

export function badRequest(message: string): ApiError {
  return new ApiError(400, message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, message);
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

  // Never expose internal error details to the client
  if (error instanceof Error) {
    console.error('[API] Internal error:', error.message, error.stack);
  }
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
