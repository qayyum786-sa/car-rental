import { PrismaClient } from '../../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET - Get checklist categories statistics OR individual category operations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const categoryId = searchParams.get('id');
    
    // If categoryId is provided, return individual category data
    if (categoryId) {
      const category = await prisma.checklistCategory.findUnique({
        where: { id: categoryId },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              description: true,
              checkType: true,
              required: true,
              active: true
            },
            orderBy: { name: 'asc' }
          }
        }
      });
      
      if (!category) {
        return NextResponse.json({ 
          error: 'Checklist category not found',
          message: 'The requested checklist category does not exist' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        message: 'Checklist category retrieved successfully',
        category,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get basic counts
    const totalCategories = await prisma.checklistCategory.count();
    const activeCategories = await prisma.checklistCategory.count({
      where: { active: true }
    });
    const inactiveCategories = await prisma.checklistCategory.count({
      where: { active: false }
    });
    
    // Get categories with and without descriptions
    const categoriesWithDescription = await prisma.checklistCategory.count({
      where: { 
        description: { not: null },
        AND: { description: { not: '' } }
      }
    });
    const categoriesWithoutDescription = totalCategories - categoriesWithDescription;
    
    // Get total checklist items count
    const totalItems = await prisma.checklistItem.count();
    const activeItems = await prisma.checklistItem.count({
      where: { active: true }
    });
    const requiredItems = await prisma.checklistItem.count({
      where: { required: true }
    });
    
    // Basic stats object
    const stats = {
      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
        withDescription: categoriesWithDescription,
        withoutDescription: categoriesWithoutDescription
      },
      items: {
        total: totalItems,
        active: activeItems,
        inactive: totalItems - activeItems,
        required: requiredItems,
        optional: totalItems - requiredItems
      },
      summary: {
        averageItemsPerCategory: totalCategories > 0 ? Math.round((totalItems / totalCategories) * 100) / 100 : 0
      }
    };
    
    // If detailed stats are requested
    if (includeDetails) {
      // Get categories with item counts
      const categoriesWithItemCounts = await prisma.checklistCategory.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      // Get top 5 categories with most items
      const topCategoriesWithItems = await prisma.checklistCategory.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          items: {
            _count: 'desc'
          }
        },
        take: 5
      });
      
      // Get categories without items
      const categoriesWithoutItems = await prisma.checklistCategory.findMany({
        where: {
          items: {
            none: {}
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          active: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      // Get check type distribution
      const checkTypeStats = await prisma.checklistItem.groupBy({
        by: ['checkType'],
        _count: {
          checkType: true
        },
        orderBy: {
          _count: {
            checkType: 'desc'
          }
        }
      });
      
      // Add detailed information to stats
      stats.details = {
        categoriesWithItemCounts: categoriesWithItemCounts.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          active: category.active,
          itemsCount: category._count.items
        })),
        topCategoriesWithMostItems: topCategoriesWithItems.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          itemsCount: category._count.items
        })),
        categoriesWithoutItems: categoriesWithoutItems,
        categoriesWithoutItemsCount: categoriesWithoutItems.length,
        checkTypeDistribution: checkTypeStats.map(stat => ({
          checkType: stat.checkType || 'unspecified',
          count: stat._count.checkType
        }))
      };
    }
    
    return NextResponse.json({
      message: 'Checklist categories statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching checklist categories statistics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch checklist categories statistics',
      message: error.message 
    }, { status: 500 });
  }
}

// PUT - Update individual checklist category
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json({ 
        error: 'Category ID is required',
        message: 'Please provide a category ID in the query parameters' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, description, active } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name is required' 
      }, { status: 400 });
    }
    
    // Check if category exists
    const existingCategory = await prisma.checklistCategory.findUnique({
      where: { id: categoryId }
    });
    
    if (!existingCategory) {
      return NextResponse.json({ 
        error: 'Checklist category not found',
        message: 'The requested checklist category does not exist' 
      }, { status: 404 });
    }
    
    // Check for duplicate name (excluding current category)
    const duplicateName = await prisma.checklistCategory.findFirst({
      where: {
        name: name.trim(),
        id: { not: categoryId }
      }
    });
    
    if (duplicateName) {
      return NextResponse.json({ 
        error: 'Duplicate category name',
        message: 'A checklist category with this name already exists' 
      }, { status: 400 });
    }
    
    // Update the category
    const updatedCategory = await prisma.checklistCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active: active !== undefined ? active : true,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'Checklist category updated successfully',
      category: updatedCategory,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating checklist category:', error);
    return NextResponse.json({ 
      error: 'Failed to update checklist category',
      message: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete individual checklist category
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json({ 
        error: 'Category ID is required',
        message: 'Please provide a category ID in the query parameters' 
      }, { status: 400 });
    }
    
    // Check if category exists
    const existingCategory = await prisma.checklistCategory.findUnique({
      where: { id: categoryId },
      include: {
        items: true
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json({ 
        error: 'Checklist category not found',
        message: 'The requested checklist category does not exist' 
      }, { status: 404 });
    }
    
    // Check if category has associated items
    if (existingCategory.items && existingCategory.items.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category',
        message: `Cannot delete checklist category "${existingCategory.name}" because it has ${existingCategory.items.length} associated items. Please delete or reassign the items first.` 
      }, { status: 400 });
    }
    
    // Delete the category
    await prisma.checklistCategory.delete({
      where: { id: categoryId }
    });
    
    return NextResponse.json({
      message: 'Checklist category deleted successfully',
      deletedCategory: {
        id: existingCategory.id,
        name: existingCategory.name,
        description: existingCategory.description
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting checklist category:', error);
    return NextResponse.json({ 
      error: 'Failed to delete checklist category',
      message: error.message 
    }, { status: 500 });
  }
}