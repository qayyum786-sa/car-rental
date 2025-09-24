// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from './app/util/jwt-access';

const PUBLIC_ROUTES = ['/login', '/api/v1/auth', 'api/v1/providers/register','api/v1/validatemobileotp','api/v1/validateemailotp', '/api/v1/users', '/api/v1/brands', '/api/v1/models', '/api/v1/variants', '/api/v1/states', '/api/v1/cities', '/api/v1/checklistcategories', '/api/v1/checklistitems'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Check if the route starts with any public route
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  
  if (isPublic) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const isValid = await verifyToken(token);
  if (!isValid) {
    return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'], // Protect APIs and dashboard routes
};
