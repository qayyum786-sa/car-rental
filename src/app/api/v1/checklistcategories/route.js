import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// CREATE - Add new checklist category
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name is required' 
      }, { status: 400 });
    }

    // Check if checklist category name already exists
    const existingCategory = await prisma.checklistCategory.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return NextResponse.json({ 
        error: 'Checklist category already exists',
        message: 'A checklist category with this name already exists' 
      }, { status: 409 });
    }
    
    const newCategory = await prisma.checklistCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active
      }
    });
    
    console.log('Checklist category created successfully:', newCategory);
    
    return NextResponse.json({
      message: 'Checklist category created successfully',
      category: newCategory
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating checklist category:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Checklist category already exists',
        message: 'A checklist category with this name already exists'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create checklist category',
        message: error.message 
      }, { status: 500 });
    }
  }
}

// READ - Get all checklist categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const includeItems = searchParams.get('includeItems') === 'true';
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }
    
    // Search by name or description
    if (search && search.trim()) {
      whereClause.OR = [
        { 
          name: { 
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        { 
          description: { 
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Prepare include clause
    const includeClause = {};
    if (includeItems) {
      includeClause.items = {
        where: { active: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          checkType: true,
          required: true,
          active: true
        }
      };
    }
    
    // Execute queries
    const categories = await prisma.checklistCategory.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: includeClause,
      orderBy: {
        name: 'asc'
      }
    });
    
    const totalCount = await prisma.checklistCategory.count({ where: whereClause });
    
    return NextResponse.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching checklist categories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch checklist categories',
      message: error.message 
    }, { status: 500 });
  }
}