import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma-client';

const prisma = new PrismaClient();

// GET - Fetch single brand by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const brand = await prisma.brands.findUnique({
      where: { id }
    });

    if (!brand) {
      return NextResponse.json({
        error: 'Brand not found',
        message: 'No brand found with the provided ID'
      }, { status: 404 });
    }

    return NextResponse.json({ brand });

  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({
      error: 'Failed to fetch brand',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update brand by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, logo, active } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name is required'
      }, { status: 400 });
    }

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return NextResponse.json({
        error: 'Brand not found',
        message: 'No brand found with the provided ID'
      }, { status: 404 });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingBrand.name) {
      const nameExists = await prisma.brands.findUnique({
        where: { name }
      });

      if (nameExists) {
        return NextResponse.json({
          error: 'Brand name already exists',
          message: 'A brand with this name already exists'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      logo,
      active: active !== undefined ? active : existingBrand.active,
    };

    // Update brand
    const updatedBrand = await prisma.brands.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Error updating brand:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Brand name already exists',
        message: 'A brand with this name already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Failed to update brand',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete brand by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return NextResponse.json({
        error: 'Brand not found',
        message: 'No brand found with the provided ID'
      }, { status: 404 });
    }

    // Optional: Check if brand is being used by any models
    // Uncomment and modify based on your schema relationships
    /*
    const modelsCount = await prisma.model.count({
      where: { brandId: id }
    });

    if (modelsCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete brand',
        message: 'This brand is associated with existing models and cannot be deleted'
      }, { status: 400 });
    }
    */

    // Delete brand
    await prisma.brands.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting brand:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Brand not found',
        message: 'The brand you are trying to delete does not exist'
      }, { status: 404 });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Cannot delete brand',
        message: 'This brand is associated with existing records and cannot be deleted'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to delete brand',
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

    // Check if brand exists
    const existingBrand = await prisma.brands.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return NextResponse.json({
        error: 'Brand not found',
        message: 'No brand found with the provided ID'
      }, { status: 404 });
    }

    // Only update provided fields
    const updateData = {};
    
    if (body.name !== undefined) {
      // Check if name already exists
      if (body.name !== existingBrand.name) {
        const nameExists = await prisma.brands.findUnique({
          where: { name: body.name }
        });

        if (nameExists) {
          return NextResponse.json({
            error: 'Brand name already exists',
            message: 'A brand with this name already exists'
          }, { status: 409 });
        }
      }
      updateData.name = body.name;
    }
    
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.active !== undefined) updateData.active = body.active;

    // Update brand with only provided fields
    const updatedBrand = await prisma.brands.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Error updating brand:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Brand name already exists',
        message: 'A brand with this name already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Failed to update brand',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}