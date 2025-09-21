import { PrismaClient } from '../../../../../../generated/prisma-client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Provider Registration API
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      mobile, 
      
      alternate_mobile, 
      address, 
      cityId, 
      stateId, 
      zipcode 
    } = body;

    console.log('Received provider registration data:', JSON.stringify(body));

    // Validate required fields
    if (!name || !email || !mobile || !alternate_mobile || !address || !cityId || !stateId || !zipcode) {
      return NextResponse.json({ 
        statusCode: "400",
        message: 'All fields are required are must be required'
      }, { status: 400 });
    }

    
   

 

    // Check if email already exists
    const existingProviderByEmail = await prisma.providers.findUnique({
      where: { email: email }
    });

    if (existingProviderByEmail) {
      return NextResponse.json({ 
        statusCode: "409",
        message: "Email  already exists. Try with different email ",
        success: false
      }, { status: 409 });
    }

    // Check if mobile already exists
    const existingProviderByMobile = await prisma.providers.findUnique({
      where: { mobile: mobile }
    });

    if (existingProviderByMobile) {
      return NextResponse.json({ 
        statusCode: "409",
        message: "Email or Mobile already exists. Try with different email or mobile",
        success: false
      }, { status: 409 });
    }

    
    

    
    // Create new provider with registration_status as "PENDING"
    const newProvider = await prisma.providers.create({
      data: {
        name,
        email,
        mobile,
        alternate_mobile,
        password: '', // Placeholder for password hashing
        address,
        cityId,
        stateId,
        zipcode,
        registration_status: "PENDING"
      }
    });
    
    console.log('Provider registered successfully:', newProvider.id);
    
    return NextResponse.json({
      statusCode: "200",
      message: "Registered Successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error registering provider:', error);
    
    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        statusCode: "409",
        message: "Email or Mobile already exists. Try with different email or mobile"
      }, { status: 409 });
    } 
    
    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        statusCode: "400",
        message: "Invalid cityId or stateId provided"
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      statusCode: "500",
      message: 'Internal server error occurred during registration'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}