import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// CREATE - Add new brand
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, logo, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name is required' 
      }, { status: 400 });
    }

    // Check if brand name already exists
    const existingBrand = await prisma.brands.findUnique({
      where: { name }
    });

    if (existingBrand) {
      return NextResponse.json({ 
        error: 'Brand already exists',
        message: 'A brand with this name already exists' 
      }, { status: 409 });
    }
    
    const newBrand = await prisma.brands.create({
      data: {
        name,
        logo,
        active
      }
    });
    
    console.log('Brand created successfully:', newBrand);
    
    return NextResponse.json({
      message: 'Brand created successfully',
      brand: newBrand
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating brand:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Brand already exists',
        message: 'A brand with this name already exists'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create brand',
        message: error.message 
      }, { status: 500 });
    }
  }
}

// READ - Get all brands
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }
    
    // Search by name
    if (search && search.trim()) {
      whereClause.name = { 
        contains: search.trim(),
        mode: 'insensitive'
      };
    }
    
    // Execute queries
    const brands = await prisma.brands.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.brands.count({ where: whereClause });
    
    return NextResponse.json({
      brands,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch brands',
      message: error.message 
    }, { status: 500 });
  }
}