"use client";

import Link from "next/link";
import { useActiveCart } from "./use-active-cart";
import { getCartMessages } from "@/content/cart";
import { CartController } from "./cart-controller";
import { CartPage } from "./cart-page";
import { createCartPageView, type CartViewLocation } from "./cart-view";

/** Browser capabilities stay in the existing merchant/location session store.
 * This route observes a cart; it never starts or replaces an ordering session. */
export function LiveCartPage({ merchantSlug, locationId, locale, location }: {
  readonly merchantSlug: string;
  readonly locationId: string;
  readonly locale: string;
  readonly location: CartViewLocation;
}) {
  const browseHref = `/${encodeURIComponent(locationId)}`;
  const resource = useActiveCart({ merchantSlug, locationId });

  if (resource.isLoading || resource.isValidating) return <main className="catalog-state" role="status">Loading your cart…</main>;
  if (resource.error) return <main className="catalog-state">
    <h1>Cart unavailable</h1>
    <p role="alert">We couldn’t load your saved cart. Try again or return to the menu.</p>
    <button onClick={() => void resource.mutate()}>Try again</button>
    <Link href={browseHref}>Return to menu</Link>
  </main>;
  if (!resource.data) return <CartPage
    cart={createCartPageView(location, getCartMessages(locale))}
    browseHref={browseHref}
  />;
  return <CartController initialCart={resource.data}
    runtime={{ mode: "live", merchantSlug }} locale={locale}
    location={location} browseHref={browseHref} />;
}
