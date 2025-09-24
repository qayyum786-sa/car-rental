import { PrismaClient } from '../../../generated/prisma-client';

const prisma = new PrismaClient();

export const findByUsername = async (username) => {
  try {
    return await prisma.users.findUnique({
      where: { username }
    });
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
};

export const createUser = async (username, hashedPassword, name, role) => {
  try {
    return await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role_id: role,
        is_active: true
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAllUsers = async (skip = 0, limit = 10, searchText = '') => {
  try {
    const whereClause = searchText ? {
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { username: { contains: searchText, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.users.findMany({
      where: whereClause,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        role_id: true,
        is_active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await prisma.users.count({ where: whereClause });

    return { users, totalCount };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const getCounts = async (is_active = null) => {
  try {
    const whereClause = is_active !== null ? { is_active } : {};
    
    const totalCount = await prisma.users.count({ where: whereClause });
    const activeCount = await prisma.users.count({ where: { is_active: true } });
    const inactiveCount = await prisma.users.count({ where: { is_active: false } });

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount
    };
  } catch (error) {
    console.error('Error getting user counts:', error);
    throw error;
  }
};

// Cleanup function
export const disconnect = async () => {
  await prisma.$disconnect();
};