import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma-client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, OTP, role_id } = body;

    // Validate required fields
    if (!mobile || !OTP || !role_id) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'Mobile, OTP and role_id are required',
        },
        { status: 400 }
      );
    }

    if (role_id === 'PROVIDER') {
      const provider = await prisma.providers.findUnique({
        where: { mobile },
      });

      if (!provider) {
        return NextResponse.json(
          {
            error: 'Provider not found',
            message: 'Provider not found with this mobile number',
          },
          { status: 404 }
        );
      }

      // Validate the OTP
      if (provider.mobileOTP !== OTP) {
        return NextResponse.json(
          {
            error: 'Invalid OTP',
            message: 'The provided mobile OTP is incorrect',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          statusCode: 200,
          message: 'Mobile OTP validated successfully',
          success: true,
        },
        { status: 200 }
      );
    } else if (role_id === 'CUSTOMER') {
      const customer = await prisma.customers.findUnique({
        where: { mobile },
      });

      if (!customer) {
        return NextResponse.json(
          {
            error: 'Customer not found',
            message: 'Customer not found with this mobile number',
          },
          { status: 404 }
        );
      }

      if (customer.mobileOTP !== OTP) {
        return NextResponse.json(
          {
            error: 'Invalid OTP',
            message: 'The provided mobile OTP is incorrect',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          statusCode: 200,
          message: 'Mobile OTP validated successfully',
          success: true,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: 'Invalid role_id',
          message: 'The provided role_id is incorrect',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mobile OTP verification failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate mobile OTP',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
