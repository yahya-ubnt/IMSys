import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// IMPORTANT: Replace with your actual JWT_SECRET from environment variables
// In a real application, this should be securely loaded from environment variables
// and not hardcoded. For Next.js middleware, you might need to expose it
// via next.config.js or ensure it's available in the edge runtime.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // --- Authentication Check ---
  const protectedRoutes = ['/dashboard', '/superadmin', '/settings']; // Add all protected routes here
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- RBAC Check for /superadmin routes ---
  if (request.nextUrl.pathname.startsWith('/superadmin')) {
    if (!token) {
      // This case should ideally be caught by the authentication check above,
      // but as a safeguard, redirect to login if token is missing for /superadmin
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      // Assuming roles are part of the JWT payload, e.g., payload.roles = ['SUPER_ADMIN', 'ADMIN']
      const userRoles = (payload.roles as string[]) || [];

      if (!userRoles.includes('SUPER_ADMIN')) {
        // Not a Super Admin, redirect to dashboard or an access denied page
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('JWT verification failed in middleware:', error);
      // Invalid token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (register page)
     * - / (root path, if it's public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|$).*)',
  ],
};
