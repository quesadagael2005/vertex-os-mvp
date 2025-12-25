// POST /api/auth/customer/signup - Customer registration
// Public endpoint

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { jsonResponse, errorResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return errorResponse('Email, password, first name, and last name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.errors.join('. '));
    }

    // Check if email already exists
    const existingMember = await prisma.member.findUnique({
      where: { email },
    });

    if (existingMember) {
      return errorResponse('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create Supabase auth user (placeholder - would integrate with Supabase Auth)
    // For now, we'll create a member with a generated auth ID
    const authId = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create member
    const member = await prisma.member.create({
      data: {
        authId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        tier: 'free',
      },
    });

    // Generate JWT token
    const tokenData = signToken({
      userId: member.id,
      email: member.email,
      role: 'member',
    });

    return jsonResponse(
      {
        user: {
          id: member.id,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          tier: member.tier,
        },
        token: tokenData.token,
        expiresIn: tokenData.expiresIn,
      },
      201
    );
  } catch (error) {
    console.error('Error creating member:', error);
    return errorResponse('Failed to create account', 500);
  }
}

