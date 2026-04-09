import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/feed');
  const isAuth = pathname === '/login' || pathname === '/register';

  // We use a cookie set on the client after login as an auth presence signal.
  const hasSession = request.cookies.has('bs_session');

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && hasSession) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/feed/:path*', '/login', '/register'],
};
