import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma-client';
import { generateToken } from '../../../util/jwt-access';
import bcrypt from 'bcryptjs';
import userService from '../../../services/users-service'



const prisma = new PrismaClient();


export async function POST(request) {
    try {
        const body = await request.json();
        const { email, OTP, password, role_id } = body;

        // Validate required fields
        if (!email || !OTP) {
            return NextResponse.json({
                error: 'Missing required fields',
                message: 'Email and OTP are required'
            }, { status: 400 });
        }

        if (role_id === 'PROVIDER') {
            let token;
            // Find the provider by email
            const provider = await prisma.providers.findUnique({
                where: { email }
            });

            if (!provider) {
                return NextResponse.json({
                    error: 'Provider not found',
                    message: 'Provider not found with the provided email'
                }, { status: 209 });
            } else {


                // Validate the email OTP
                if (provider.emailOTP !== OTP) {
                    return NextResponse.json({
                        error: 'Invalid OTP',
                        message: 'Invalid OTP'
                    }, { status: 401 });
                } else {
                    let user = await prisma.users.findUnique({
                        where: { username: provider.mobile }
                    });
                    if (!user) {
                        const hashedpassword = await bcrypt.hash(password, 10);
                        const [providerObject, newUser] = await prisma.$transaction([

                            prisma.users.create({
                                data: {
                                    name: provider.name,
                                    username: provider.mobile,
                                    password: hashedpassword,
                                    role_id: 'PROVIDER',
                                    is_active: true,

                                }
                            }),
                            prisma.providers.update({
                                where: { email },
                                data: {
                                    registration_status: 'PENDING_APPROVAL',
                                    emailOTP: OTP,
                                    updatedAt: new Date()
                                }
                            })
                        ]);

                        
                        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
                        const tokenPayload = {
                            id: user.id,
                            name: user.name,
                            username: user.username,
                        };


                        token = await generateToken(tokenPayload);

                        // Prepare response (exclude sensitive data)
                        const { password: _, ...userResponse } = result.newUser;



                    }
                }



                // Generate JWT token with user details

            }

            return NextResponse.json({
                message: 'Email OTP validated successfully and provider registered',
                data: token,
            }, { status: 200 });
        }
        else if (role_id === 'CUSTOMER') {
        }


    } catch (error) {
        console.error('Error validating email OTP:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json({
                error: 'Username conflict',
                message: 'Generated username already exists. Please try again.'
            }, { status: 409 });
        }

        return NextResponse.json({
            error: 'Failed to validate email OTP',
            message: error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}