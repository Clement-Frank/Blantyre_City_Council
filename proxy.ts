import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const apiKey = request.headers.get("x-api-key");

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
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === "/login" || pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/external/:path*", "/"],
};