import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 允许访问输入密码的页面和静态资源
  if (
    pathname === "/enter-password" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. 检查 Cookie 中是否已经有正确的访问令牌
  const sitePassword = process.env.SITE_PASSWORD;
  
  // 如果没设置环境变量，则不启用密码保护
  if (!sitePassword) {
    return (await auth()) ? NextResponse.next() : NextResponse.next();
  }

  const hasAccess = request.cookies.get("site-access")?.value === sitePassword;

  if (!hasAccess) {
    // 重定向到密码输入页
    const url = request.nextUrl.clone();
    url.pathname = "/enter-password";
    return NextResponse.redirect(url);
  }

  // 3. 密码验证通过后，继续执行原有的 Auth 逻辑
  return (await auth()) ? NextResponse.next() : NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
