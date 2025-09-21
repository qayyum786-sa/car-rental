import { PrismaClient } from '../../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET - Get states statistics OR individual state operations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const stateId = searchParams.get('id');
    
    // If stateId is provided, return individual state data
    if (stateId) {
      const state = await prisma.state.findUnique({
        where: { id: stateId },
        include: {
          cities: {
            select: {
              id: true,
              name: true,
              active: true
            }
          }
        }
      });
      
      if (!state) {
        return NextResponse.json({ 
          error: 'State not found',
          message: 'The requested state does not exist' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        message: 'State retrieved successfully',
        state,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get basic counts
    const totalStates = await prisma.state.count();
    const activeStates = await prisma.state.count({
      where: { active: true }
    });
    const inactiveStates = await prisma.state.count({
      where: { active: false }
    });
    
    // Get total cities count
    const totalCities = await prisma.city.count();
    const activeCities = await prisma.city.count({
      where: { active: true }
    });
    
    // Basic stats object
    const stats = {
      states: {
        total: totalStates,
        active: activeStates,
        inactive: inactiveStates
      },
      cities: {
        total: totalCities,
        active: activeCities,
        inactive: totalCities - activeCities
      },
      summary: {
        averageCitiesPerState: totalStates > 0 ? Math.round((totalCities / totalStates) * 100) / 100 : 0
      }
    };
    
    // If detailed stats are requested
    if (includeDetails) {
      // Get states with city counts
      const statesWithCityCounts = await prisma.state.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          active: true,
          _count: {
            select: {
              cities: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      // Get top 5 states with most cities
      const topStatesWithCities = await prisma.state.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              cities: true
            }
          }
        },
        orderBy: {
          cities: {
            _count: 'desc'
          }
        },
        take: 5
      });
      
      // Get states without cities
      const statesWithoutCities = await prisma.state.findMany({
        where: {
          cities: {
            none: {}
          }
        },
        select: {
          id: true,
          name: true,
          code: true,
          active: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      // Add detailed information to stats
      stats.details = {
        statesWithCityCounts: statesWithCityCounts.map(state => ({
          id: state.id,
          name: state.name,
          code: state.code,
          active: state.active,
          citiesCount: state._count.cities
        })),
        topStatesWithMostCities: topStatesWithCities.map(state => ({
          id: state.id,
          name: state.name,
          code: state.code,
          citiesCount: state._count.cities
        })),
        statesWithoutCities: statesWithoutCities,
        statesWithoutCitiesCount: statesWithoutCities.length
      };
    }
    
    return NextResponse.json({
      message: 'States statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching states statistics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch states statistics',
      message: error.message 
    }, { status: 500 });
  }
}

// PUT - Update individual state
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('id');
    
    if (!stateId) {
      return NextResponse.json({ 
        error: 'State ID is required',
        message: 'Please provide a state ID in the query parameters' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, code, active } = body;
    
    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and code are required' 
      }, { status: 400 });
    }
    
    // Check if state exists
    const existingState = await prisma.state.findUnique({
      where: { id: stateId }
    });
    
    if (!existingState) {
      return NextResponse.json({ 
        error: 'State not found',
        message: 'The requested state does not exist' 
      }, { status: 404 });
    }
    
    // Check for duplicate name (excluding current state)
    const duplicateName = await prisma.state.findFirst({
      where: {
        name: name.trim(),
        id: { not: stateId }
      }
    });
    
    if (duplicateName) {
      return NextResponse.json({ 
        error: 'Duplicate state name',
        message: 'A state with this name already exists' 
      }, { status: 400 });
    }
    
    // Check for duplicate code (excluding current state)
    const duplicateCode = await prisma.state.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: stateId }
      }
    });
    
    if (duplicateCode) {
      return NextResponse.json({ 
        error: 'Duplicate state code',
        message: 'A state with this code already exists' 
      }, { status: 400 });
    }
    
    // Update the state
    const updatedState = await prisma.state.update({
      where: { id: stateId },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        active: active !== undefined ? active : true,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'State updated successfully',
      state: updatedState,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating state:', error);
    return NextResponse.json({ 
      error: 'Failed to update state',
      message: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete individual state
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('id');
    
    if (!stateId) {
      return NextResponse.json({ 
        error: 'State ID is required',
        message: 'Please provide a state ID in the query parameters' 
      }, { status: 400 });
    }
    
    // Check if state exists
    const existingState = await prisma.state.findUnique({
      where: { id: stateId },
      include: {
        cities: true
      }
    });
    
    if (!existingState) {
      return NextResponse.json({ 
        error: 'State not found',
        message: 'The requested state does not exist' 
      }, { status: 404 });
    }
    
    // Check if state has associated cities
    if (existingState.cities && existingState.cities.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete state',
        message: `Cannot delete state "${existingState.name}" because it has ${existingState.cities.length} associated cities. Please delete or reassign the cities first.` 
      }, { status: 400 });
    }
    
    // Delete the state
    await prisma.state.delete({
      where: { id: stateId }
    });
    
    return NextResponse.json({
      message: 'State deleted successfully',
      deletedState: {
        id: existingState.id,
        name: existingState.name,
        code: existingState.code
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json({ 
      error: 'Failed to delete state',
      message: error.message 
    }, { status: 500 });
  }
}