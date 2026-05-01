import { NextResponse } from "next/server";

import { auth } from "@/auth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Auth.js routes precisam passar livres (signIn, callback, signOut etc.)
  if (pathname.startsWith("/admin/api/")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ADMIN_PATHS.has(pathname);
  const isAuthed = !!req.auth;

  if (!isAuthed && !isPublic) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};
