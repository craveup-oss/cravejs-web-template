"use client";

import { useState } from "react";
import { CheckoutCartSummary } from "./checkout-cart-summary";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import styles from "./checkout-identity.module.css";

import type { CheckoutAdjustmentRuntime } from "./checkout-adjustment-runtime";
import {
  CheckoutIdentity,
  type CheckoutIdentityResult,
} from "./checkout-identity";
import { PickupCheckoutPreflight } from "./pickup-checkout-preflight";
import type { CheckoutGratuityState } from "./load-checkout-adjustment-config";
import type { CheckoutOrderTimes } from "./scheduling/checkout-scheduling";
import type { OrderTimeRuntime } from "@/features/fulfillment/time/order-time-runtime";
import type { StorefrontHostedCheckoutConfig } from "./hosted-checkout-integration";
import type { CheckoutHandoffRuntime } from "./secure-checkout-action";
import { TablesideCheckoutPreflight } from "./tableside-checkout-preflight";

export interface CheckoutIdentityRouteProps {
  readonly merchantSlug: string;
  readonly locale: string;
  readonly mode: "fixture" | "live";
  readonly backHref: string;
  readonly locationId: string;
  readonly locationAddress?: string;
  readonly tableIdentifier?: string;
  readonly adjustmentRuntime: CheckoutAdjustmentRuntime;
  readonly checkoutConfig: StorefrontHostedCheckoutConfig;
  readonly handoffRuntime: CheckoutHandoffRuntime;
  readonly gratuity: CheckoutGratuityState;
  readonly orderTimes?: CheckoutOrderTimes;
  readonly orderTimeRuntime?: OrderTimeRuntime;
}

export function CheckoutIdentityRoute(props: CheckoutIdentityRouteProps) {
  const scopeKey = JSON.stringify([
    props.merchantSlug,
    props.locationId,
    props.tableIdentifier ?? null,
    props.checkoutConfig.checkoutOrigins,
  ]);
  return <ScopedCheckoutIdentityRoute key={scopeKey} {...props} />;
}

function ScopedCheckoutIdentityRoute(props: CheckoutIdentityRouteProps) {
  const [signIn, setSignIn] = useState(false);
  const [identity, setIdentity] = useState<CheckoutIdentityResult | null>(null);

  if (identity) {
    if (props.tableIdentifier) {
      return (
        <TablesideCheckoutPreflight
          backHref={props.backHref}
          checkoutConfig={props.checkoutConfig}
          handoffRuntime={props.handoffRuntime}
          identity={identity}
          locale={props.locale}
          locationId={props.locationId}
          merchantSlug={props.merchantSlug}
          mode={props.mode}
          tableIdentifier={props.tableIdentifier}
        />
      );
    }
    if (!props.orderTimes || !props.orderTimeRuntime) {
      throw new TypeError("Pickup checkout scheduling configuration is required.");
    }
    return (
      <PickupCheckoutPreflight
        adjustmentRuntime={props.adjustmentRuntime}
        backHref={props.backHref}
        checkoutConfig={props.checkoutConfig}
        gratuity={props.gratuity}
        handoffRuntime={props.handoffRuntime}
        identity={identity}
        locationAddress={props.locationAddress}
        locationId={props.locationId}
        locale={props.locale}
        merchantSlug={props.merchantSlug}
        mode={props.mode}
        orderTimes={props.orderTimes}
        orderTimeRuntime={props.orderTimeRuntime}
      />
    );
  }
  if (!signIn) return (
    <section className={`${styles.surface} checkout-contact-layout`} aria-label="Checkout details">
      <div className={`${styles.content} checkout-contact-content`}>
        <Link href={props.backHref}>Back to cart</Link>
        <h1 className={styles.heading}>Your details</h1>
        <p className={styles.description}>We’ll use this information to keep you updated about your order.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const customerName = String(data.get("firstName") ?? "").trim();
          const customerEmail = String(data.get("email") ?? "").trim();
          if (!customerName || !customerEmail) return;
          setIdentity({profile: {customerName, customerEmail, lastName: String(data.get("lastName") ?? "").trim(), phoneNumber: String(data.get("phone") ?? "").trim() || null}});
        }}>
          <div className="checkout-contact-names"><label className={styles.nameField}>First name<input name="firstName" autoComplete="given-name" required maxLength={100} /></label><label className={styles.nameField}>Last name<input name="lastName" autoComplete="family-name" required maxLength={100} /></label></div>
          <label className={styles.nameField}>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label className={styles.nameField}>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label><Button type="submit">Continue as guest</Button>
        </form>
        <button className={styles.resend} type="button" onClick={() => setSignIn(true)}>Sign in instead</button>
      </div>
      <CheckoutCartSummary {...props} />
    </section>
  );
  return (
    <CheckoutIdentity
      merchantSlug={props.merchantSlug}
      locale={props.locale}
      mode={props.mode}
      backHref={props.backHref}
      {...(props.tableIdentifier ? { tableIdentifier: props.tableIdentifier } : {})}
      onComplete={setIdentity}
    />
  );
}
