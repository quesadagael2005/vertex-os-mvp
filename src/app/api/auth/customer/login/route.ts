// POST /api/auth/customer/login - Customer login
// Public endpoint

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { comparePassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { jsonResponse, errorResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await comparePassword(password, member.passwordHash);

    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const tokenData = signToken({
      userId: member.id,
      email: member.email,
      role: 'member',
    });

    return jsonResponse({
      user: {
        id: member.id,
        email: member.email,
        tier: member.tier,
      },
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return errorResponse('Failed to log in', 500);
  }
}
