import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma-client';

const prisma = new PrismaClient();

// GET - Fetch single checklist item by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const checklistItem = await prisma.checklistItem.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!checklistItem) {
      return NextResponse.json({
        error: 'Checklist item not found',
        message: 'No checklist item found with the provided ID'
      }, { status: 404 });
    }

    return NextResponse.json({ checklistItem });

  } catch (error) {
    console.error('Error fetching checklist item:', error);
    return NextResponse.json({
      error: 'Failed to fetch checklist item',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update checklist item by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, categoryId, description, checkType, required, active } = body;

    // Validate required fields
    if (!name || !categoryId) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name and categoryId are required'
      }, { status: 400 });
    }

    // Check if checklist item exists
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json({
        error: 'Checklist item not found',
        message: 'No checklist item found with the provided ID'
      }, { status: 404 });
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

    // Check if name is being changed and if it already exists in the same category
    if (name && (name !== existingItem.name || categoryId !== existingItem.categoryId)) {
      const nameExists = await prisma.checklistItem.findFirst({
        where: { 
          name,
          categoryId,
          id: { not: id } // Exclude current item
        }
      });

      if (nameExists) {
        return NextResponse.json({
          error: 'Checklist item name already exists',
          message: 'A checklist item with this name already exists in this category'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      categoryId,
      description,
      checkType,
      required: required !== undefined ? required : existingItem.required,
      active: active !== undefined ? active : existingItem.active,
    };

    // Update checklist item
    const updatedItem = await prisma.checklistItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    return NextResponse.json({
      message: 'Checklist item updated successfully',
      checklistItem: updatedItem
    });

  } catch (error) {
    console.error('Error updating checklist item:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Checklist item name already exists',
        message: 'A checklist item with this name already exists in this category'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Failed to update checklist item',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete checklist item by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if checklist item exists
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json({
        error: 'Checklist item not found',
        message: 'No checklist item found with the provided ID'
      }, { status: 404 });
    }

    // Optional: Check if checklist item is being used in any inspections/checklists
    // Uncomment and modify based on your schema relationships
    /*
    const usageCount = await prisma.inspection.count({
      where: { checklistItemId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete checklist item',
        message: 'This checklist item is associated with existing inspections and cannot be deleted'
      }, { status: 400 });
    }
    */

    // Delete checklist item
    await prisma.checklistItem.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Checklist item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting checklist item:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Checklist item not found',
        message: 'The checklist item you are trying to delete does not exist'
      }, { status: 404 });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Cannot delete checklist item',
        message: 'This checklist item is associated with existing records and cannot be deleted'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to delete checklist item',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Partial update (for status changes, etc.)
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if checklist item exists
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json({
        error: 'Checklist item not found',
        message: 'No checklist item found with the provided ID'
      }, { status: 404 });
    }

    // Only update provided fields
    const updateData = {};
    
    if (body.name !== undefined) {
      // Check if name already exists in the same category
      const categoryId = body.categoryId || existingItem.categoryId;
      if (body.name !== existingItem.name) {
        const nameExists = await prisma.checklistItem.findFirst({
          where: { 
            name: body.name,
            categoryId,
            id: { not: id }
          }
        });

        if (nameExists) {
          return NextResponse.json({
            error: 'Checklist item name already exists',
            message: 'A checklist item with this name already exists in this category'
          }, { status: 409 });
        }
      }
      updateData.name = body.name;
    }
    
    if (body.categoryId !== undefined) {
      // Check if category exists
      const existingCategory = await prisma.checklistCategory.findUnique({
        where: { id: body.categoryId }
      });

      if (!existingCategory) {
        return NextResponse.json({
          error: 'Category not found',
          message: 'The specified category does not exist'
        }, { status: 404 });
      }

      // Check if name already exists in the new category
      const nameExists = await prisma.checklistItem.findFirst({
        where: { 
          name: body.name || existingItem.name,
          categoryId: body.categoryId,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json({
          error: 'Checklist item name already exists',
          message: 'A checklist item with this name already exists in the target category'
        }, { status: 409 });
      }

      updateData.categoryId = body.categoryId;
    }
    
    if (body.description !== undefined) updateData.description = body.description;
    if (body.checkType !== undefined) updateData.checkType = body.checkType;
    if (body.required !== undefined) updateData.required = body.required;
    if (body.active !== undefined) updateData.active = body.active;

    // Update checklist item with only provided fields
    const updatedItem = await prisma.checklistItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    return NextResponse.json({
      message: 'Checklist item updated successfully',
      checklistItem: updatedItem
    });

  } catch (error) {
    console.error('Error updating checklist item:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Checklist item name already exists',
        message: 'A checklist item with this name already exists in this category'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Failed to update checklist item',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}