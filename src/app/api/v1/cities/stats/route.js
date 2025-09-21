import { PrismaClient } from '../../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

// Create a singleton Prisma client to avoid connection issues
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET - Get cities statistics OR individual city operations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const cityId = searchParams.get('id');
    
    // If cityId is provided, return individual city data
    if (cityId) {
      const city = await prisma.city.findUnique({
        where: { id: cityId },
        include: {
          state: {
            select: {
              id: true,
              name: true,
              code: true,
              active: true
            }
          }
        }
      });
      
      if (!city) {
        return NextResponse.json({ 
          error: 'City not found',
          message: 'The requested city does not exist' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        message: 'City retrieved successfully',
        city,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get basic counts
    const totalCities = await prisma.city.count();
    const activeCities = await prisma.city.count({
      where: { active: true }
    });
    const inactiveCities = await prisma.city.count({
      where: { active: false }
    });
    
    // Get cities with pincode vs without pincode
    const citiesWithPincode = await prisma.city.count({
      where: { 
        pincode: { not: null },
        active: true
      }
    });
    
    const citiesWithoutPincode = await prisma.city.count({
      where: { 
        pincode: null,
        active: true
      }
    });
    
    // Get total states count for reference
    const totalStates = await prisma.state.count();
    const activeStates = await prisma.state.count({
      where: { active: true }
    });
    
    // Basic stats object
    const stats = {
      cities: {
        total: totalCities,
        active: activeCities,
        inactive: inactiveCities,
        withPincode: citiesWithPincode,
        withoutPincode: citiesWithoutPincode
      },
      states: {
        total: totalStates,
        active: activeStates
      },
      summary: {
        averageCitiesPerState: activeStates > 0 ? Math.round((activeCities / activeStates) * 100) / 100 : 0,
        pincodeCompletionRate: activeCities > 0 ? Math.round((citiesWithPincode / activeCities) * 10000) / 100 : 0
      }
    };
    
    // If detailed stats are requested
    if (includeDetails) {
      // Get cities grouped by state
      const citiesByState = await prisma.state.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          active: true,
          _count: {
            select: {
              cities: {
                where: { active: true }
              }
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
              cities: {
                where: { active: true }
              }
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
            none: {
              active: true
            }
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
      
      // Get cities without pincode by state
      const citiesWithoutPincodeByState = await prisma.city.groupBy({
        by: ['stateId'],
        where: {
          pincode: null,
          active: true
        },
        _count: {
          id: true
        }
      });
      
      // Get state names for cities without pincode
      const stateIds = citiesWithoutPincodeByState.map(item => item.stateId);
      const statesInfo = await prisma.state.findMany({
        where: {
          id: { in: stateIds }
        },
        select: {
          id: true,
          name: true,
          code: true
        }
      });
      
      const citiesWithoutPincodeDetails = citiesWithoutPincodeByState.map(item => {
        const stateInfo = statesInfo.find(state => state.id === item.stateId);
        return {
          stateId: item.stateId,
          stateName: stateInfo?.name || 'Unknown',
          stateCode: stateInfo?.code || 'Unknown',
          citiesWithoutPincode: item._count.id
        };
      });
      
      // Add detailed information to stats
      stats.details = {
        citiesByState: citiesByState.map(state => ({
          id: state.id,
          name: state.name,
          code: state.code,
          active: state.active,
          activeCitiesCount: state._count.cities
        })),
        topStatesWithMostCities: topStatesWithCities.map(state => ({
          id: state.id,
          name: state.name,
          code: state.code,
          activeCitiesCount: state._count.cities
        })),
        statesWithoutCities: statesWithoutCities,
        statesWithoutCitiesCount: statesWithoutCities.length,
        citiesWithoutPincodeByState: citiesWithoutPincodeDetails
      };
    }
    
    return NextResponse.json({
      message: 'Cities statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching cities statistics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cities statistics',
      message: error.message 
    }, { status: 500 });
  }
}

// PUT - Update individual city
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('id');
    
    if (!cityId) {
      return NextResponse.json({ 
        error: 'City ID is required',
        message: 'Please provide a city ID in the query parameters' 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, stateId, pincode, active } = body;
    
    // Validate required fields
    if (!name || !stateId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name and stateId are required' 
      }, { status: 400 });
    }
    
    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id: cityId }
    });
    
    if (!existingCity) {
      return NextResponse.json({ 
        error: 'City not found',
        message: 'The requested city does not exist' 
      }, { status: 404 });
    }
    
    // Check if state exists
    const existingState = await prisma.state.findUnique({
      where: { id: stateId }
    });
    
    if (!existingState) {
      return NextResponse.json({ 
        error: 'State not found',
        message: 'The specified state does not exist' 
      }, { status: 400 });
    }
    
    // Check for duplicate name in the same state (excluding current city)
    const duplicateCity = await prisma.city.findFirst({
      where: {
        name: name.trim(),
        stateId: stateId,
        id: { not: cityId }
      }
    });
    
    if (duplicateCity) {
      return NextResponse.json({ 
        error: 'Duplicate city name',
        message: 'A city with this name already exists in the selected state' 
      }, { status: 400 });
    }
    
    // Update the city
    const updatedCity = await prisma.city.update({
      where: { id: cityId },
      data: {
        name: name.trim(),
        stateId: stateId,
        pincode: pincode ? pincode.trim() : null,
        active: active !== undefined ? active : true,
        updatedAt: new Date()
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            active: true
          }
        }
      }
    });
    
    return NextResponse.json({
      message: 'City updated successfully',
      city: updatedCity,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json({ 
      error: 'Failed to update city',
      message: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete individual city
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('id');
    
    if (!cityId) {
      return NextResponse.json({ 
        error: 'City ID is required',
        message: 'Please provide a city ID in the query parameters' 
      }, { status: 400 });
    }
    
    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    if (!existingCity) {
      return NextResponse.json({ 
        error: 'City not found',
        message: 'The requested city does not exist' 
      }, { status: 404 });
    }
    
    // Note: Add any additional checks here if cities are referenced by other models
    // For example, if there are providers, bookings, or other entities linked to cities
    
    // Delete the city
    await prisma.city.delete({
      where: { id: cityId }
    });
    
    return NextResponse.json({
      message: 'City deleted successfully',
      deletedCity: {
        id: existingCity.id,
        name: existingCity.name,
        state: existingCity.state,
        pincode: existingCity.pincode
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json({ 
      error: 'Failed to delete city',
      message: error.message 
    }, { status: 500 });
  }
}