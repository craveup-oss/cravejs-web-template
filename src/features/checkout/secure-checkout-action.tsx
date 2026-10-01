"use client";

import type { StorefrontCart } from "@craveup/storefront-sdk";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  FixtureCheckoutPrepareScenario,
  FixtureRuntime,
} from "@/fixtures/fixture-runtime";
import type { StorefrontCheckoutActions } from "@/lib/storefront/checkout-actions";

import {
  createStorefrontHostedCheckoutHandoff,
  type StorefrontHostedCheckoutConfig,
} from "./hosted-checkout-integration";
import type {
  HostedCheckoutAttemptInput,
  HostedCheckoutHandoff,
  HostedCheckoutSnapshot,
  NavigateTopLevel,
} from "./hosted-checkout";
import {
  getSecureCheckoutActionMessages,
} from "./secure-checkout-action.messages";

export type CheckoutHandoffRuntime =
  | Readonly<{
      mode: "fixture";
      runtime: FixtureRuntime;
      referenceNowMs: number;
      scenario?: FixtureCheckoutPrepareScenario;
    }>
  | Readonly<{ mode: "live"; merchantSlug: string }>;

interface AttemptIdentity {
  readonly cartFingerprint: string;
  readonly attemptId: string;
  readonly idempotencyKey: string;
}

function lazyCheckoutActions(
  runtime: CheckoutHandoffRuntime,
): StorefrontCheckoutActions {
  let actionsPromise: Promise<StorefrontCheckoutActions> | undefined;
  return {
    prepare(input) {
      actionsPromise ??= runtime.mode === "fixture"
        ? import("@/fixtures/checkout-actions").then((module) =>
            module.createFixtureStorefrontCheckoutActions(
              runtime.runtime,
              runtime.scenario ? { scenario: runtime.scenario } : {},
            ),
          )
        : import("@/lib/storefront/browser-client").then((module) =>
            module.createBrowserStorefrontCheckoutActions(
              runtime.merchantSlug,
            ),
          );
      return actionsPromise.then((actions) => actions.prepare(input));
    },
  };
}

function browserTopLevelNavigation(opaqueUrl: string): void {
  window.location.assign(opaqueUrl);
}

function createHandoff(
  runtime: CheckoutHandoffRuntime,
  config: StorefrontHostedCheckoutConfig,
  navigateTopLevel: NavigateTopLevel,
): HostedCheckoutHandoff {
  return createStorefrontHostedCheckoutHandoff({
    config,
    checkoutActions: lazyCheckoutActions(runtime),
    navigateTopLevel,
    ...(runtime.mode === "fixture"
      ? { now: () => runtime.referenceNowMs }
      : {}),
  });
}

const editingSnapshot: HostedCheckoutSnapshot = Object.freeze({ state: "editing" });

function cartFingerprint(cart: StorefrontCart): string {
  return JSON.stringify([
    cart.locationId,
    cart.id,
    cart.revision,
    cart.fulfilmentMethod,
    cart.tableServiceInfo?.tableNumber ?? null,
  ]);
}

function createAttempt(cart: StorefrontCart): AttemptIdentity {
  return {
    cartFingerprint: cartFingerprint(cart),
    attemptId: globalThis.crypto.randomUUID(),
    idempotencyKey: globalThis.crypto.randomUUID(),
  };
}

function handoffInput(
  cart: StorefrontCart,
  attempt: AttemptIdentity,
): HostedCheckoutAttemptInput {
  return {
    attemptId: attempt.attemptId,
    locationId: cart.locationId,
    cartId: cart.id,
    revision: cart.revision,
    idempotencyKey: attempt.idempotencyKey,
    validation: {
      cart: "valid",
      customer: "valid",
      fulfillment: "valid",
      location: "valid",
      schedule: "valid",
    },
  };
}

export function SecureCheckoutAction({
  cart,
  config,
  disabled = false,
  label,
  locale,
  navigateTopLevel = browserTopLevelNavigation,
  runtime,
}: {
  readonly cart: StorefrontCart;
  readonly config: StorefrontHostedCheckoutConfig;
  readonly disabled?: boolean;
  readonly label: string;
  readonly locale: string;
  readonly navigateTopLevel?: NavigateTopLevel;
  readonly runtime: CheckoutHandoffRuntime;
}) {
  const scope = JSON.stringify([
    config.merchantSlug,
    config.checkoutOrigins,
    cartFingerprint(cart),
    runtime.mode,
    runtime.mode === "fixture" ? runtime.runtime.config.profile : "live",
  ]);
  return (
    <ScopedSecureCheckoutAction
      key={scope}
      cart={cart}
      config={config}
      disabled={disabled}
      label={label}
      locale={locale}
      navigateTopLevel={navigateTopLevel}
      runtime={runtime}
    />
  );
}

function ScopedSecureCheckoutAction({
  cart,
  config,
  disabled,
  label,
  locale,
  navigateTopLevel,
  runtime,
}: {
  readonly cart: StorefrontCart;
  readonly config: StorefrontHostedCheckoutConfig;
  readonly disabled: boolean;
  readonly label: string;
  readonly locale: string;
  readonly navigateTopLevel: NavigateTopLevel;
  readonly runtime: CheckoutHandoffRuntime;
}) {
  // The parent keys this component by checkout scope, so the mount-time inputs are authoritative.
  const scopeRef = useRef({ config, navigateTopLevel, runtime });
  const handoffRef = useRef<HostedCheckoutHandoff | null>(null);
  const [snapshot, setSnapshot] = useState<HostedCheckoutSnapshot>(editingSnapshot);
  const attemptRef = useRef<AttemptIdentity | undefined>(undefined);
  const issueRef = useRef<HTMLParagraphElement>(null);
  const noteId = useId();
  const messages = getSecureCheckoutActionMessages(locale);

  // Own the handoff per effect lifetime: a Strict Mode replay disposes the first
  // instance and creates a fresh one instead of leaving a disposed handoff behind.
  useEffect(() => {
    const scope = scopeRef.current;
    const handoff = createHandoff(scope.runtime, scope.config, scope.navigateTopLevel);
    handoffRef.current = handoff;
    const unsubscribe = handoff.subscribe(() => setSnapshot(handoff.getSnapshot()));
    return () => {
      unsubscribe();
      handoff.dispose();
      if (handoffRef.current === handoff) handoffRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (snapshot.state === "failed" || snapshot.state === "outcome-unknown") {
      issueRef.current?.focus();
    }
  }, [snapshot.state]);

  const pending = ["validating", "preparing", "opening"].includes(
    snapshot.state,
  );
  const handedOff = snapshot.state === "handed-off";
  const issue =
    snapshot.state === "failed" || snapshot.state === "outcome-unknown"
      ? messages.issue(snapshot)
      : "";
  const status = snapshot.state === "opening"
    ? messages.opening
    : handedOff
      ? messages.handedOff
      : "";

  async function startCheckout(): Promise<void> {
    const handoff = handoffRef.current;
    if (!handoff) return;
    const current = handoff.getSnapshot();
    if (current.state === "handoff-ready") {
      handoff.open();
      return;
    }
    if (current.state === "failed" || current.state === "canceled-before-open") {
      handoff.reset();
      attemptRef.current = undefined;
    }
    const fingerprint = cartFingerprint(cart);
    if (
      !attemptRef.current ||
      attemptRef.current.cartFingerprint !== fingerprint
    ) {
      attemptRef.current = createAttempt(cart);
    }
    const result = await handoff.prepare(
      handoffInput(cart, attemptRef.current),
    );
    if (result.state === "handoff-ready") {
      const opened = handoff.open();
      if (opened.state !== "outcome-unknown") attemptRef.current = undefined;
    } else if (result.state !== "outcome-unknown") {
      attemptRef.current = undefined;
    }
  }

  return (
    <div aria-busy={pending}>
      <p id={noteId}>{messages.note}</p>
      {issue ? (
        <p ref={issueRef} role="alert" tabIndex={-1}>
          {issue}
        </p>
      ) : null}
      <p role="status" aria-live="polite">
        {status}
      </p>
      <Button
        aria-describedby={noteId}
        disabled={disabled || pending || handedOff}
        onClick={() => void startCheckout()}
      >
        {pending ? messages.preparing : label}
      </Button>
    </div>
  );
}
