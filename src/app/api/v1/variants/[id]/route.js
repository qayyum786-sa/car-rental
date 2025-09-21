import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma-client';

const prisma = new PrismaClient();

// GET - Fetch single variant by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const variant = await prisma.variant.findUnique({
      where: { id },
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
      }
    });

    if (!variant) {
      return NextResponse.json({
        error: 'Variant not found',
        message: 'No variant found with the provided ID'
      }, { status: 404 });
    }

    return NextResponse.json({ variant });

  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json({
      error: 'Failed to fetch variant',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update variant by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, modelId, fuelType, transmission, seatingCapacity, active } = body;

    // Validate required fields
    if (!name || !modelId) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name and modelId are required'
      }, { status: 400 });
    }

    // Check if variant exists
    const existingVariant = await prisma.variant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json({
        error: 'Variant not found',
        message: 'No variant found with the provided ID'
      }, { status: 404 });
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

    // Update variant
    const updatedVariant = await prisma.variant.update({
      where: { id },
      data: {
        name,
        modelId,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity || null,
        active: active !== undefined ? active : existingVariant.active,
      },
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
      }
    });

    return NextResponse.json({
      message: 'Variant updated successfully',
      variant: updatedVariant
    });

  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({
      error: 'Failed to update variant',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete variant by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if variant exists
    const existingVariant = await prisma.variant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json({
        error: 'Variant not found',
        message: 'No variant found with the provided ID'
      }, { status: 404 });
    }

    // Delete variant
    await prisma.variant.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Variant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting variant:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Variant not found',
        message: 'The variant you are trying to delete does not exist'
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Failed to delete variant',
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

    // Check if variant exists
    const existingVariant = await prisma.variant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json({
        error: 'Variant not found',
        message: 'No variant found with the provided ID'
      }, { status: 404 });
    }

    // Only update provided fields
    const updateData = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    
    if (body.modelId !== undefined) {
      // Validate that the model exists
      const modelExists = await prisma.models.findUnique({
        where: { id: body.modelId }
      });

      if (!modelExists) {
        return NextResponse.json({ 
          error: 'Invalid model',
          message: 'The specified model does not exist' 
        }, { status: 400 });
      }
      updateData.modelId = body.modelId;
    }
    
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType || null;
    if (body.transmission !== undefined) updateData.transmission = body.transmission || null;
    
    if (body.seatingCapacity !== undefined) {
      if (body.seatingCapacity !== null && (!Number.isInteger(body.seatingCapacity) || body.seatingCapacity <= 0)) {
        return NextResponse.json({ 
          error: 'Invalid seating capacity',
          message: 'Seating capacity must be a positive integer' 
        }, { status: 400 });
      }
      updateData.seatingCapacity = body.seatingCapacity;
    }
    
    if (body.active !== undefined) updateData.active = body.active;

    // Update variant with only provided fields
    const updatedVariant = await prisma.variant.update({
      where: { id },
      data: updateData,
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
      }
    });

    return NextResponse.json({
      message: 'Variant updated successfully',
      variant: updatedVariant
    });

  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({
      error: 'Failed to update variant',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}