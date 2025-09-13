import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; 

const prisma = new PrismaClient();

// CREATE - Add new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, username, password, role_id, is_active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !username || !password || !role_id) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name, username, password, and role_id are required' 
      }, { status: 400 });
    }

    // Validate role_id against enum values
    const validRoles = ['ADMIN', 'MECHANIC', 'DRIVER', 'PROVIDER', 'CUSTOMER'];
    if (!validRoles.includes(role_id)) {
      return NextResponse.json({ 
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}` 
      }, { status: 400 });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await prisma.users.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role_id,
        is_active
      }
    });
    
    // Remove password from response
    const { password: _, ...userResponse } = newUser;
    console.log('User created successfully:', userResponse);
    
    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Username already exists',
        message: 'A user with this username already exists'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create user',
        message: error.message 
      }, { status: 500 });
    }
  } finally {
    await prisma.$disconnect();
  }
}

// READ - Get all users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const role_id = searchParams.get('role_id');
    const is_active = searchParams.get('is_active');
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    if (role_id) whereClause.role_id = role_id;
    if (is_active !== null && is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    const users = await prisma.users.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        role_id: true,
        is_active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.users.count({ where: whereClause });
    
    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      message: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}