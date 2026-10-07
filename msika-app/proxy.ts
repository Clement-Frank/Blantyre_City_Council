import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const apiKey = request.headers.get("x-api-key");
  let isAuthenticated = false;

  if (token) {
    try {
      await verifyToken(token);
      isAuthenticated = true;
    } catch {
      // Invalid or expired sessions should be treated as signed out.
    }
  }

  // API routes with API Key (external providers)
  if (pathname.startsWith("/api/external")) {
    if (!apiKey) {
      return NextResponse.json({ error: "API Key required" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Webhook routes (no auth needed, but signature validation recommended)
  if (pathname.startsWith("/api/webhook")) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      if (token) response.cookies.delete("token");
      return response;
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();
  if (token && !isAuthenticated) response.cookies.delete("token");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/external/:path*", "/"],
};