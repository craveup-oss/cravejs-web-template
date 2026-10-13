"use client";

import Image from "next/image";
import Link from "next/link";
import { useActiveCart } from "@/features/cart/use-active-cart";
import { createCartPageView } from "@/features/cart/cart-view";
import { OrderSummary } from "@/features/cart/order-summary";
import { getCartMessages } from "@/content/cart";

export function CheckoutCartSummary(props: { merchantSlug: string; locationId: string; mode: "fixture" | "live"; locale: string; backHref: string }) {
  const resource = useActiveCart(props);
  if (resource.isLoading) return <aside className="checkout-bag-summary" role="status">Loading your bag…</aside>;
  if (resource.error) return <aside className="checkout-bag-summary"><p role="alert">Your bag could not be loaded.</p><button type="button" onClick={() => void resource.mutate()}>Try again</button><Link href={props.backHref}>Review your bag</Link></aside>;
  if (!resource.data) return null;
  const cart = resource.data;
  const view = createCartPageView({ name: cart.restaurantDisplayName }, getCartMessages(props.locale), cart);
  return <aside className="checkout-bag-summary" aria-label="Your order">
    <div className="checkout-bag-heading"><h2>Your order</h2><Link href={props.backHref}>Edit bag</Link></div>
    <ul>{view.items.map(item => <li key={item.id}>
      {item.imageSrc ? <Image src={item.imageSrc} alt="" width={64} height={64} /> : null}
      <div><h3>{item.name}</h3><p>Quantity {item.quantity}</p></div><strong>{item.formattedLineTotal}</strong>
    </li>)}</ul>
    <OrderSummary rows={view.summaryRows} formattedTotal={view.formattedTotal} heading={view.orderSummaryLabel} totalLabel={view.totalLabel} />
  </aside>;
}
