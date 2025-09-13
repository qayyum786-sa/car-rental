import bcrypt from 'bcryptjs';
import { generateToken } from '../../../util/jwt-access';
import { PrismaClient } from '../../../../../generated/prisma-client';

const prisma = new PrismaClient();

export async function POST(req) {
  const { username, password } = await req.json();

  try{
  // Replace this with your real DB query to get user info by username
  const userFromDB = await prisma.users.findUnique({
    where: { username    },
  });

  if(!userFromDB){
    return new Response(JSON.stringify({ message: 'User not found', statusCode: 401 }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  } else if(!userFromDB.is_active){
    return new Response(JSON.stringify({ message: 'User is inactive', statusCode: 403 }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  console.log("User found:", userFromDB);
  // Compare provided password with hashed password in DB
  console.log('Comparing passwords:', password, userFromDB.password);
  const isPasswordValid = await bcrypt.compare(password, userFromDB.password);

  console.log("Authenticating user:", isPasswordValid ? "Success" : "Failure");

  if (!isPasswordValid) {
    return new Response(JSON.stringify({ message: 'Invalid Credentials', statusCode: 401 }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  console.log("User authenticated:", username);
  

  const token = await generateToken({ username });

  console.log("Generating token for user:", token);
  return new Response(JSON.stringify({
    message: "Login Successful",
    data: token,
    statusCode: 200,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}catch(error){
  return new Response(JSON.stringify({ message: 'Internal Server Error: '+error.message, statusCode: 500 }), { status: 500, headers: { 'Content-Type': 'application/json' } }); 
  }
}
