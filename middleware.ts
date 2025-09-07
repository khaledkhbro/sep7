import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const protectedPaths = ["/dashboard", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    // In a real app, you'd check for a valid session token and user status
    // For now, we'll check localStorage on the client side
    const response = NextResponse.next()
    response.headers.set("x-middleware-cache", "no-cache")
    response.headers.set("x-auth-required", "true")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
