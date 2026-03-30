import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { authConfig } from '@/config/auth.config';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isMainRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/groups');

  if (isMainRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = authConfig.redirects.unauthenticated;
    return NextResponse.redirect(url);
  }

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = authConfig.redirects.afterLogin;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
