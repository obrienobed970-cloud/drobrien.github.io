import { NextResponse, type NextRequest } from "next/server";

// The admin console lives at app/console but is only reachable through the
// secret path in ADMIN_PATH. Hitting /console directly returns a 404.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.ADMIN_PATH?.replace(/^\/+|\/+$/g, "");

  if (pathname === "/console" || pathname.startsWith("/console/")) {
    return NextResponse.rewrite(new URL("/__not-found", req.url));
  }
  if (secret && pathname === `/${secret}`) {
    const res = NextResponse.rewrite(new URL("/console", req.url));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|cv.docx).*)"],
};
