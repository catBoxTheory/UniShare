import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 严格放行静态资源、API 和 密码页
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname === "/enter-password" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. 检查密码保护
  const sitePassword = process.env.SITE_PASSWORD;
  if (sitePassword) {
    const hasAccess = request.cookies.get("site-access")?.value === sitePassword;
    
    if (!hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/enter-password";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // 排除所有静态文件路径
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
