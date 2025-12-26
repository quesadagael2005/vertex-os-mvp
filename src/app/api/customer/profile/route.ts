// GET /api/customer/profile - Get customer profile
// PUT /api/customer/profile - Update customer profile
// Protected endpoint - requires customer authentication

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['member']);

    const member = await prisma.member.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        tier: true,
        stripeCustomerId: true,
        createdAt: true,
      },
    });

    if (!member) {
      return errorResponse('Member not found', 404);
    }

    return jsonResponse(member);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching profile:', error);
    return errorResponse('Failed to fetch profile', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, ['member']);
    const body = await request.json();
    const { firstName, lastName, phone } = body;

    // Update member
    const member = await prisma.member.update({
      where: { id: user.userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        tier: true,
      },
    });

    return jsonResponse(member);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error updating profile:', error);
    return errorResponse('Failed to update profile', 500);
  }
}

