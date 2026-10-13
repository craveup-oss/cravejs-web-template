import { readRequestStorefrontRuntime } from "@/lib/tenant/server-storefront-runtime";

export const dynamic = "force-dynamic";

// Container configuration readiness only. Browser ordering acceptance is a
// separate control-plane check bound to the backend and storefront deployments.
export async function GET() {
  try {
    const runtime = await readRequestStorefrontRuntime();
    if (runtime?.mode !== "live") throw new Error("Unconfigured storefront");
    return Response.json(
      { status: "ready", scope: "storefront_configuration", orderingVerified: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable", scope: "storefront_configuration", orderingVerified: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
