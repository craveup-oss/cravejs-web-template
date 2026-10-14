"use client";

import type { CartChangeReason, StorefrontCart } from "@craveup/storefront-sdk";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money/format-money";
import styles from "./cart-page.module.css";

const reasons: Record<CartChangeReason, string> = {
  PRICE_CHANGED: "Price changed",
  POLICY_CHANGED: "Ordering terms changed",
  QUOTE_EXPIRED: "Prices need confirmation",
  ITEM_SOLD_OUT: "Sold out",
  ITEM_UNAVAILABLE: "No longer available",
  MODIFIER_UNAVAILABLE: "An option is no longer available",
  MODIFIER_RULE_CHANGED: "Choose your options again",
  QUANTITY_REDUCED: "Available quantity changed",
  SCHEDULE_CLOSED: "Pickup time is no longer available",
  FULFILLMENT_UNAVAILABLE: "Order method is no longer available",
  MAPPING_MISSING: "Item needs to be selected again",
};

export function CatalogChangeReview({ cart, locale, pending, onAccept }: {
  cart: StorefrontCart; locale: string; pending: boolean; onAccept: () => void;
}) {
  const review = cart.catalogRevalidation;
  if (!review?.required) return null;
  const changes = review.changeSet?.changes ?? [];
  const canAccept = changes.length > 0 && changes.every((change) => change.permittedActions.includes("ACCEPT_CHANGES"));
  return <section className={styles.mutationNotice} aria-label="Menu changes" aria-live="polite">
    <h2>The menu has changed</h2>
    <p>Review these changes before continuing. Your order is still saved.</p>
    <ul>{changes.map((change, index) => {
      const item = cart.items.find((item) => item.id === change.cartItemId);
      const price = change.reason === "PRICE_CHANGED" && typeof change.before === "string" && typeof change.after === "string"
        ? `${formatMoney(change.before, cart.currency, locale)} → ${formatMoney(change.after, cart.currency, locale)}` : null;
      return <li key={`${change.path}:${index}`}>
        {item ? `${item.name}: ` : ""}{reasons[change.reason]}{price ? ` · ${price}` : ""}
      </li>;
    })}</ul>
    {canAccept ? <>
      <p>Accepting updates your order and recalculates the total. You can review the total before payment.</p>
      <Button disabled={pending} onClick={onAccept}>{pending ? "Updating order…" : "Accept changes"}</Button>
    </> : <p>Remove affected items and choose them again from the menu, or update your pickup details.</p>}
  </section>;
}
