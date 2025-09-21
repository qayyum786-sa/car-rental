import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// CREATE - Add new city
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, stateId, pincode, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !stateId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and stateId are required' 
      }, { status: 400 });
    }

    // Check if state exists
    const existingState = await prisma.state.findUnique({
      where: { id: stateId }
    });

    if (!existingState) {
      return NextResponse.json({ 
        error: 'State not found',
        message: 'The specified state does not exist' 
      }, { status: 400 });
    }

    // Check if city name already exists in the same state
    const existingCity = await prisma.city.findFirst({
      where: { 
        name: name.trim(),
        stateId: stateId
      }
    });

    if (existingCity) {
      return NextResponse.json({ 
        error: 'City already exists',
        message: 'A city with this name already exists in the selected state' 
      }, { status: 409 });
    }
    
    const newCity = await prisma.city.create({
      data: {
        name: name.trim(),
        stateId,
        pincode: pincode ? pincode.trim() : null,
        active
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    console.log('City created successfully:', newCity);
    
    return NextResponse.json({
      message: 'City created successfully',
      city: newCity
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating city:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'City already exists',
        message: 'A city with this name already exists in the selected state'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create city',
        message: error.message 
      }, { status: 500 });
    }
  }
}

// READ - Get all cities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const stateId = searchParams.get('stateId');
    const includeState = searchParams.get('includeState') === 'true';
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }
    
    // Filter by state
    if (stateId && stateId.trim()) {
      whereClause.stateId = stateId.trim();
    }
    
    // Search by name or pincode
    if (search && search.trim()) {
      whereClause.OR = [
        { 
          name: { 
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        { 
          pincode: { 
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Prepare include clause
    const includeClause = {};
    if (includeState) {
      includeClause.state = {
        select: {
          id: true,
          name: true,
          code: true,
          active: true
        }
      };
    }
    
    // Execute queries
    const cities = await prisma.city.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: includeClause,
      orderBy: {
        name: 'asc'
      }
    });
    
    const totalCount = await prisma.city.count({ where: whereClause });
    
    return NextResponse.json({
      cities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cities',
      message: error.message 
    }, { status: 500 });
  }
}