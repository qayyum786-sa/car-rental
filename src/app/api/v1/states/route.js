import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// CREATE - Add new state
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and code are required' 
      }, { status: 400 });
    }

    // Check if state name already exists
    const existingStateName = await prisma.state.findUnique({
      where: { name }
    });

    if (existingStateName) {
      return NextResponse.json({ 
        error: 'State already exists',
        message: 'A state with this name already exists' 
      }, { status: 409 });
    }

    // Check if state code already exists
    const existingStateCode = await prisma.state.findUnique({
      where: { code }
    });

    if (existingStateCode) {
      return NextResponse.json({ 
        error: 'State code already exists',
        message: 'A state with this code already exists' 
      }, { status: 409 });
    }
    
    const newState = await prisma.state.create({
      data: {
        name,
        code: code.toUpperCase(), // Store state codes in uppercase
        active
      }
    });
    
    console.log('State created successfully:', newState);
    
    return NextResponse.json({
      message: 'State created successfully',
      state: newState
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating state:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'State already exists',
        message: 'A state with this name or code already exists'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create state',
        message: error.message 
      }, { status: 500 });
    }
  }
}

// READ - Get all states
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const includeCities = searchParams.get('includeCities') === 'true';
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }
    
    // Search by name or code
    if (search && search.trim()) {
      whereClause.OR = [
        { 
          name: { 
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        { 
          code: { 
            contains: search.trim().toUpperCase(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Prepare include clause
    const includeClause = {};
    if (includeCities) {
      includeClause.cities = {
        where: { active: true },
        orderBy: { name: 'asc' }
      };
    }
    
    // Execute queries
    const states = await prisma.state.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: includeClause,
      orderBy: {
        name: 'asc'
      }
    });
    
    const totalCount = await prisma.state.count({ where: whereClause });
    
    return NextResponse.json({
      states,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch states',
      message: error.message 
    }, { status: 500 });
  }
}