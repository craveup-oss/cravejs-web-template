import { NextResponse, type NextRequest } from "next/server";
import { createStorefrontSecurityHeaders } from "./config/storefront-security";
import { resolveStorefrontRuntime } from "./lib/tenant/storefront-runtime";

// Use the same tenant resolver as rendering and the SDK; nothing is fetched
// from request-supplied URLs and no installation policy is baked into the image.
export async function proxy(request: NextRequest) {
  try {
    const runtime = await resolveStorefrontRuntime({
      host: request.headers.get("host") ?? "",
      pathname: request.nextUrl.pathname,
    });
    if (!runtime) return new NextResponse("Storefront not configured", { status: 404 });
    const response = NextResponse.next();
    for (const header of createStorefrontSecurityHeaders({
      apiOrigin: runtime.config.apiBaseUrl,
      assetOrigins: runtime.config.assetOrigins,
      development: process.env.NODE_ENV !== "production",
    })) response.headers.set(header.key, header.value);
    return response;
  } catch {
    return new NextResponse("Storefront configuration unavailable", { status: 503 });
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
