import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; 

const prisma = new PrismaClient();

// CREATE - Add new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, username, password, role_id } = body;
        console.log(JSON.stringify(body));

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 5);
    console.log(JSON.stringify(body));
    const newUser = await prisma.users.create({
      data: {
        name,
        username,
        passsword: hashedPassword,
        role_id      }
    });
    
    // Remove password from response
    const { passsword, ...userResponse } = newUser;
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Failed to create user'+error.message }, { status: 500 });
    }
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
    if (is_active !== null) whereClause.is_active = is_active === 'true';
    
    const users = await prisma.users.findMany(
      {
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
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
