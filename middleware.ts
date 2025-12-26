import { NextResponse } from "next/server";
import type { NextRequest } from "next/request";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 允许访问密码页面、静态资源和 Auth API
  if (
    pathname === "/enter-password" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // 2. 检查站点密码
  const sitePassword = process.env.SITE_PASSWORD;
  
  // 如果设置了密码，则进行拦截
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

// 匹配所有页面路径
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
