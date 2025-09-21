import { PrismaClient } from '../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// CREATE - Add new checklist item
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, categoryId, description, checkType, required = false, active = true } = body;
    console.log('Received data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !categoryId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and categoryId are required' 
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.checklistCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return NextResponse.json({ 
        error: 'Category not found',
        message: 'The specified category does not exist' 
      }, { status: 404 });
    }

    // Check if checklist item name already exists in the same category
    const existingItem = await prisma.checklistItem.findFirst({
      where: { 
        name,
        categoryId 
      }
    });

    if (existingItem) {
      return NextResponse.json({ 
        error: 'Checklist item already exists',
        message: 'A checklist item with this name already exists in this category' 
      }, { status: 409 });
    }
    
    const newChecklistItem = await prisma.checklistItem.create({
      data: {
        name,
        categoryId,
        description,
        checkType,
        required,
        active
      },
      include: {
        category: true
      }
    });
    
    console.log('Checklist item created successfully:', newChecklistItem);
    
    return NextResponse.json({
      message: 'Checklist item created successfully',
      checklistItem: newChecklistItem
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating checklist item:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Checklist item already exists',
        message: 'A checklist item with this name already exists in this category'
      }, { status: 409 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to create checklist item',
        message: error.message 
      }, { status: 500 });
    }
  }
}

// READ - Get all checklist items
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const checkType = searchParams.get('checkType');
    const required = searchParams.get('required');
    
    const skip = (page - 1) * limit;
    
    const whereClause = {};
    
    // Filter by active status
    if (active !== null && active !== undefined && active !== '') {
      whereClause.active = active === 'true';
    }
    
    // Filter by category
    if (categoryId && categoryId.trim()) {
      whereClause.categoryId = categoryId.trim();
    }
    
    // Filter by check type
    if (checkType && checkType.trim()) {
      whereClause.checkType = checkType.trim();
    }
    
    // Filter by required status
    if (required !== null && required !== undefined && required !== '') {
      whereClause.required = required === 'true';
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
    
    // Execute queries
    const checklistItems = await prisma.checklistItem.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.checklistItem.count({ where: whereClause });
    
    return NextResponse.json({
      checklistItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch checklist items',
      message: error.message 
    }, { status: 500 });
  }
}