import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// CREATE - Add new model
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, brandId, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !brandId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and brandId are required' 
      }, { status: 400 });
    }

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id: brandId }
    });

    if (!existingBrand) {
      return NextResponse.json({ 
        error: 'Brand not found',
        message: 'The specified brand does not exist' 
      }, { status: 404 });
    }

    // Check if model name already exists for this brand
    const existingModel = await prisma.models.findFirst({
      where: { 
        name,
        brandId 
      }
    });

    if (existingModel) {
      return NextResponse.json({ 
        error: 'Model already exists',
        message: 'A model with this name already exists for this brand' 
      }, { status: 409 });
    }
    
    const newModel = await prisma.models.create({
      data: {
        name,
        brandId,
        active
      },
      include: {
        brand: true
      }
    });
    
    console.log('Model created successfully:', newModel);
    
    return NextResponse.json({
      message: 'Model created successfully',
      model: newModel
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating model:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Model already exists',
        message: 'A model with this name already exists for this brand'
      }, { status: 409 });
    } else if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Invalid brand reference',
        message: 'The specified brand does not exist'
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create model',
        message: error.message 
      }, { status: 500 });
    }
  } finally {
    await prisma.$disconnect();
  }
}

// READ - Get all models
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const brandId = searchParams.get('brandId');
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined) {
      whereClause.active = active === 'true';
    }
    
    // Filter by brand - support multiple brands filtering by parsing comma-separated list
    if (brandId) {
      const brands = brandId.split(',').map(b => b.trim()).filter(Boolean);
      if (brands.length === 1) {
        whereClause.brandId = brands[0];
      } else if (brands.length > 1) {
        whereClause.brandId = { in: brands };
      }
    }
    
    // Search by name
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }
    
    const models = await prisma.models.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        brand: true,
        variants: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            fuelType: true,
            transmission: true,
            seatingCapacity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.models.count({ where: whereClause });
    
    return NextResponse.json({
      models,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch models',
      message: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}