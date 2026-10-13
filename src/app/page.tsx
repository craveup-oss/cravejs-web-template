import { notFound, redirect } from "next/navigation";

import { StorefrontNotOpen } from "@/features/status/storefront-not-open";

import { Button } from "@/components/ui/button";
import { StorefrontStoreDirectoryError } from "@/lib/storefront/store-directory";

import { getStorefrontServerStoreDirectory } from "@/lib/storefront/server-store-directory";

import { readRequestStorefrontRuntime } from "@/lib/tenant/server-storefront-runtime";

export default async function Home() {
  const runtime = await readRequestStorefrontRuntime();
  if (runtime?.mode === "live" && runtime.defaultLocationId) {
    const directory = await getStorefrontServerStoreDirectory();
    let merchant;
    try {
      merchant = await directory.merchant.getBySlug(runtime.config.merchantSlug);
    } catch (error) {
      if (!(error instanceof StorefrontStoreDirectoryError) || error.state !== "network-error") {
        throw error;
      }
      return (
        <main className="route-error" role="alert">
          <h1>The menu is taking longer than expected</h1>
          <p>We couldn’t connect to the restaurant. Please try again.</p>
          <form action="/" method="get">
            <Button type="submit">Try again</Button>
          </form>
        </main>
      );
    }
    if (!merchant || merchant.locations.length === 0) {
      return <StorefrontNotOpen retryHref="/" />;
    }
    if (!merchant.locations.some((location) => location.id === runtime.defaultLocationId)) {
      notFound();
    }
    return redirect(`/${encodeURIComponent(runtime.defaultLocationId)}`);
  }
  redirect(runtime?.mode === "fixture" ? "/demo" : "/stores");
}
