import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// CREATE - Add new variant
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, modelId, fuelType, transmission, seatingCapacity, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !modelId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and modelId are required' 
      }, { status: 400 });
    }

    // Validate that the model exists
    const modelExists = await prisma.models.findUnique({
      where: { id: modelId }
    });

    if (!modelExists) {
      return NextResponse.json({ 
        error: 'Invalid model',
        message: 'The specified model does not exist' 
      }, { status: 400 });
    }

    // Validate seatingCapacity if provided
    if (seatingCapacity !== undefined && seatingCapacity !== null) {
      if (!Number.isInteger(seatingCapacity) || seatingCapacity <= 0) {
        return NextResponse.json({ 
          error: 'Invalid seating capacity',
          message: 'Seating capacity must be a positive integer' 
        }, { status: 400 });
      }
    }
    
    const newVariant = await prisma.variant.create({
      data: {
        name,
        modelId,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity || null,
        active
      },
      include: {
        model: {
          include: {
            brand: true
          }
        }
      }
    });
    
    console.log('Variant created successfully:', newVariant);
    
    return NextResponse.json({
      message: 'Variant created successfully',
      variant: newVariant
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating variant:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Variant already exists',
        message: 'A variant with this name already exists for this model'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create variant',
        message: error.message 
      }, { status: 500 });
    }
  } finally {
    await prisma.$disconnect();
  }
}

// READ - Get all variants with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const modelId = searchParams.get('modelId');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};

    // Filter by modelId
    if (modelId) {
      whereClause.modelId = modelId;
    }

    // Filter by fuelType
    if (fuelType) {
      whereClause.fuelType = fuelType;
    }

    // Filter by transmission
    if (transmission) {
      whereClause.transmission = transmission;
    }

    // Filter by active status
    if (active !== null && active !== undefined) {
      whereClause.active = active === 'true';
    }

    // Search by name
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    const variants = await prisma.variant.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        model: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.variant.count({ where: whereClause });
    
    return NextResponse.json({
      variants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch variants',
      message: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}