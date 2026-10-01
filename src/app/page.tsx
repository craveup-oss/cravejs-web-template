import { notFound, redirect } from "next/navigation";

import { getStorefrontServerStoreDirectory } from "@/lib/storefront/server-store-directory";

import { readRequestStorefrontRuntime } from "@/lib/tenant/server-storefront-runtime";

export default async function Home() {
  const runtime = await readRequestStorefrontRuntime();
  if (runtime?.mode === "live" && runtime.defaultLocationId) {
    const directory = await getStorefrontServerStoreDirectory();
    const merchant = await directory.merchant.getBySlug(runtime.config.merchantSlug);
    if (!merchant?.locations.some((location) => location.id === runtime.defaultLocationId)) {
      notFound();
    }
    return redirect(`/${encodeURIComponent(runtime.defaultLocationId)}`);
  }
  redirect(runtime?.mode === "fixture" ? "/demo" : "/stores");
}
