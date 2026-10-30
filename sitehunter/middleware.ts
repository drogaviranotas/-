import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/login", "/reset", "/privacidade"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // As rotas de API fazem sua própria autenticação e retornam JSON/HTTP 401.
  // Evita redirecionar chamadas fetch para uma página HTML de login.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Páginas públicas e arquivos estáticos.
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".") ||
    PUBLIC_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
  ) {
    return NextResponse.next();
  }

  // O cookie correto é definido em lib/auth.ts como "sh_session".
  if (!req.cookies.has("sh_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
