import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - Fetch single user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role_id: true,
        is_active: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      error: 'Failed to fetch user',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update user by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, username, role_id, is_active, password } = body;

    // Validate required fields
    if (!name || !username || !role_id) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name, username, and role_id are required'
      }, { status: 400 });
    }

    // Validate role_id against enum values
    const validRoles = ['ADMIN', 'MECHANIC', 'DRIVER', 'PROVIDER', 'CUSTOMER'];
    if (!validRoles.includes(role_id)) {
      return NextResponse.json({ 
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}` 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      }, { status: 404 });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.users.findUnique({
        where: { username }
      });

      if (usernameExists) {
        return NextResponse.json({
          error: 'Username already exists',
          message: 'A user with this username already exists'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      username,
      role_id,
      is_active: is_active !== undefined ? is_active : existingUser.is_active,
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role_id: true,
        is_active: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      error: 'Failed to update user',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete user by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      }, { status: 404 });
    }

    // Prevent deletion of the last admin user (optional safety check)
    if (existingUser.role_id === 'ADMIN') {
      const adminCount = await prisma.users.count({
        where: {
          role_id: 'ADMIN',
          is_active: true
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json({
          error: 'Cannot delete user',
          message: 'Cannot delete the last active admin user'
        }, { status: 400 });
      }
    }

    // Delete user
    await prisma.users.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'User not found',
        message: 'The user you are trying to delete does not exist'
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Failed to delete user',
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

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      }, { status: 404 });
    }

    // Only update provided fields
    const updateData = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.username !== undefined) {
      // Check if username already exists
      if (body.username !== existingUser.username) {
        const usernameExists = await prisma.users.findUnique({
          where: { username: body.username }
        });

        if (usernameExists) {
          return NextResponse.json({
            error: 'Username already exists',
            message: 'A user with this username already exists'
          }, { status: 409 });
        }
      }
      updateData.username = body.username;
    }
    if (body.role_id !== undefined) {
      // Validate role_id against enum values
      const validRoles = ['ADMIN', 'MECHANIC', 'DRIVER', 'PROVIDER', 'CUSTOMER'];
      if (!validRoles.includes(body.role_id)) {
        return NextResponse.json({ 
          error: 'Invalid role',
          message: `Role must be one of: ${validRoles.join(', ')}` 
        }, { status: 400 });
      }
      updateData.role_id = body.role_id;
    }
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    if (body.password && body.password.trim() !== '') {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    // Update user with only provided fields
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role_id: true,
        is_active: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      error: 'Failed to update user',
      message: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}