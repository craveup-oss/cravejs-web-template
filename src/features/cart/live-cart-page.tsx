"use client";

import Link from "next/link";
import useSWR from "swr";
import { getCartMessages } from "@/content/cart";
import { createBrowserStorefrontClient } from "@/lib/storefront/browser-client";
import { createMerchantCartSessionStore } from "@/lib/storefront/session-store";
import { getCustomerToken } from "@/lib/storefront/customer-session";
import { useStorefrontApiOrigin } from "@/lib/storefront/public-api-origin";
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
  const apiOrigin = useStorefrontApiOrigin();
  const browseHref = `/${encodeURIComponent(locationId)}`;
  const resource = useSWR(["live-cart", apiOrigin, merchantSlug, locationId], async () => {
    const sessionStore = createMerchantCartSessionStore(merchantSlug);
    const session = await sessionStore.get(locationId);
    if (!session) return null;
    const client = createBrowserStorefrontClient({
      sessionStore,
      getAuthToken: () => getCustomerToken(merchantSlug),
    });
    const cart = await client.cart.get(locationId, session.cartId);
    if (cart.locationId !== locationId || cart.id !== session.cartId) {
      throw new Error("Cart scope mismatch");
    }
    return cart;
  }, { revalidateOnFocus: false, shouldRetryOnError: false });

  if (resource.isLoading) return <main className="catalog-state" role="status">Loading your cart…</main>;
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
