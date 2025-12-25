// API Route Protection Middleware
// Verify JWT and extract user info from requests

import { NextRequest } from 'next/server';
import { verifyToken, extractToken, type JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Authenticate request and extract user
 * Throws error if authentication fails
 */
export async function authenticate(request: NextRequest): Promise<JWTPayload> {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const user = verifyToken(token);
    return user;
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Require specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'member' | 'cleaner' | 'admin'>
): Promise<JWTPayload> {
  const user = await authenticate(request);

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }

  return user;
}

/**
 * API response helpers
 */
export function jsonResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message: string = 'Not found') {
  return Response.json({ error: message }, { status: 404 });
}

export function serverErrorResponse(message: string = 'Internal server error') {
  return Response.json({ error: message }, { status: 500 });
}

