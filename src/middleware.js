// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from './app/util/jwt-access';

const PUBLIC_ROUTES = ['/login', '/api/v1/auth', '/api/v1/users'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname)) {
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
