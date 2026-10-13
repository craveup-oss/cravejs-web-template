"use client";

import type { ResolvedStorefrontConfig } from "@/config/storefront-config";

import { createBrowserStorefrontClient } from "./browser-client";
import { setActiveStorefrontMerchant } from "./session-store";
import {
  createStorefrontTelemetryActions,
  type StorefrontTelemetryPolicy,
} from "./telemetry";

export type StorefrontTelemetryRuntimeConfig = Pick<
  ResolvedStorefrontConfig,
  "profile" | "tenantId" | "merchantSlug"
>;

export function createBrowserStorefrontTelemetryActions(
  config: StorefrontTelemetryRuntimeConfig,
  policy: StorefrontTelemetryPolicy,
) {
  return createStorefrontTelemetryActions(
    createBrowserStorefrontClient(),
    config,
    policy,
    { setMerchantScope: setActiveStorefrontMerchant },
  );
}
