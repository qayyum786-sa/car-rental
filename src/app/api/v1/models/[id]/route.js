import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma-client';

const prisma = new PrismaClient();

// GET - Fetch single model by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const model = await prisma.models.findUnique({
      where: { id },
      include: {
        brand: true,
        variants: {
          where: { active: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!model) {
      return NextResponse.json({
        error: 'Model not found',
        message: 'No model found with the provided ID'
      }, { status: 404 });
    }

    return NextResponse.json({ model });

  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json({
      error: 'Failed to fetch model',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update model by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, brandId, active } = body;

    // Validate required fields
    if (!name || !brandId) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name and brandId are required'
      }, { status: 400 });
    }

    // Check if model exists
    const existingModel = await prisma.models.findUnique({
      where: { id }
    });

    if (!existingModel) {
      return NextResponse.json({
        error: 'Model not found',
        message: 'No model found with the provided ID'
      }, { status: 404 });
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

    // Check if name is being changed and if it already exists for this brand
    if (name && (name !== existingModel.name || brandId !== existingModel.brandId)) {
      const nameExists = await prisma.models.findFirst({
        where: { 
          name,
          brandId,
          id: { not: id } // Exclude current model
        }
      });

      if (nameExists) {
        return NextResponse.json({
          error: 'Model name already exists',
          message: 'A model with this name already exists for this brand'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      brandId,
      active: active !== undefined ? active : existingModel.active,
    };

    // Update model
    const updatedModel = await prisma.models.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        variants: {
          where: { active: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Model updated successfully',
      model: updatedModel
    });

  } catch (error) {
    console.error('Error updating model:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Model name already exists',
        message: 'A model with this name already exists for this brand'
      }, { status: 409 });
    }

    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Invalid brand reference',
        message: 'The specified brand does not exist'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Failed to update model',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete model by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if model exists
    const existingModel = await prisma.models.findUnique({
      where: { id }
    });

    if (!existingModel) {
      return NextResponse.json({
        error: 'Model not found',
        message: 'No model found with the provided ID'
      }, { status: 404 });
    }

    // Check if model has variants
    const variantsCount = await prisma.variant.count({
      where: { modelId: id }
    });

    if (variantsCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete model',
        message: 'This model has associated variants and cannot be deleted. Please delete all variants first.'
      }, { status: 400 });
    }

    // Delete model
    await prisma.models.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Model deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting model:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Model not found',
        message: 'The model you are trying to delete does not exist'
      }, { status: 404 });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Cannot delete model',
        message: 'This model is associated with existing records and cannot be deleted'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to delete model',
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

    // Check if model exists
    const existingModel = await prisma.models.findUnique({
      where: { id }
    });

    if (!existingModel) {
      return NextResponse.json({
        error: 'Model not found',
        message: 'No model found with the provided ID'
      }, { status: 404 });
    }

    // Only update provided fields
    const updateData = {};
    
    if (body.name !== undefined) {
      const brandIdToCheck = body.brandId !== undefined ? body.brandId : existingModel.brandId;
      
      // Check if name already exists for this brand
      if (body.name !== existingModel.name) {
        const nameExists = await prisma.models.findFirst({
          where: { 
            name: body.name,
            brandId: brandIdToCheck,
            id: { not: id }
          }
        });

        if (nameExists) {
          return NextResponse.json({
            error: 'Model name already exists',
            message: 'A model with this name already exists for this brand'
          }, { status: 409 });
        }
      }
      updateData.name = body.name;
    }
    
    if (body.brandId !== undefined) {
      // Check if brand exists
      const existingBrand = await prisma.brands.findUnique({
        where: { id: body.brandId }
      });

      if (!existingBrand) {
        return NextResponse.json({
          error: 'Brand not found',
          message: 'The specified brand does not exist'
        }, { status: 404 });
      }

      updateData.brandId = body.brandId;
    }
    
    if (body.active !== undefined) updateData.active = body.active;

    // Update model with only provided fields
    const updatedModel = await prisma.models.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        variants: {
          where: { active: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Model updated successfully',
      model: updatedModel
    });

  } catch (error) {
    console.error('Error updating model:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Model name already exists',
        message: 'A model with this name already exists for this brand'
      }, { status: 409 });
    }

    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Invalid brand reference',
        message: 'The specified brand does not exist'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Failed to update model',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}