import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/types/domain";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/auth/"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as UserRole) ?? UserRole.Manager;

  if (pathname.startsWith("/dashboard/users") && role !== UserRole.Admin) {
    return NextResponse.redirect(new URL("/dashboard/report", req.url));
  }

  if (
    pathname.startsWith("/dashboard/team") ||
    pathname.startsWith("/dashboard/plans") ||
    pathname.startsWith("/dashboard/missed-reports") ||
    pathname.startsWith("/dashboard/comments")
  ) {
    if (role === UserRole.Manager) {
      return NextResponse.redirect(new URL("/dashboard/report", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

