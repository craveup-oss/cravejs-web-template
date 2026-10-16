"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { StorefrontShell } from "@/components/shell/storefront-shell";
import { MenuItemCard } from "@/components/ui/menu-item-card";
import { useStorefrontApiOrigin } from "@/lib/storefront/public-api-origin";

const product = z.object({ id: z.string(), name: z.string(), description: z.string().optional(), displayPrice: z.string(), images: z.array(z.string()).optional() });
const preview = z.object({ location: z.object({ id: z.string(), restaurantDisplayName: z.string() }), menus: z.array(z.object({ id: z.string(), name: z.string(), categories: z.array(z.object({ id: z.string(), name: z.string(), products: z.array(product) })) })) });

/** The existing scoped preview grant authorizes catalog reads only, never checkout. */
export function StorefrontPreview({ locationId }: { locationId: string }) {
  const origin = useStorefrontApiOrigin();
  const [data, setData] = useState<z.infer<typeof preview> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const token = window.location.hash.slice(1);
    // Keep the grant out of server logs and referrers; no checkout client is mounted.
    void Promise.resolve().then(() => {
      if (!/^[a-f0-9]{64}$/.test(token) || !origin) throw Error("preview_unavailable");
      return fetch(`${origin}/api/v1/storefront/locations/${encodeURIComponent(locationId)}/preview`, {
      headers: { Authorization: `Preview ${token}` }, cache: "no-store", redirect: "error", signal: controller.signal,
    }); }).then(async response => {
      if (!response.ok) throw Error("preview_unavailable");
      const result = preview.parse(await response.json());
      if (result.location.id !== locationId) throw Error("preview_scope_mismatch");
      setData(result);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [locationId, origin]);
  return <StorefrontShell variant="menu-preview" header={<aside className="sandbox-demo-banner">Storefront preview · Orders are off</aside>}>
    <header className="catalog-section-header"><div><h1>{data?.location.restaurantDisplayName ?? "Your storefront"}</h1><p>Edit these items in Business Manager. Set up your business details and payments when you’re ready to take orders.</p></div></header>
    {error ? <p role="alert">This preview has expired or is unavailable. Open a fresh preview from your Console.</p> : !data ? <p role="status">Loading your menu…</p> : data.menus.map(menu => <section key={menu.id}><h2>{menu.name}</h2>{menu.categories.map(category => <section key={category.id}><header className="catalog-section-header"><h2>{category.name}</h2></header><div className="menu-item-grid">{category.products.map(item => <MenuItemCard key={item.id} name={item.name} description={item.description} formattedPrice={item.displayPrice} imageSrc={item.images?.[0]} availability="available" />)}</div></section>)}</section>)}
  </StorefrontShell>;
}
