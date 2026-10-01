import type { ResolvedStorefrontConfig } from "./storefront-config.ts";

/** Public project settings. Generators replace projectId once and preserve it on upgrade.
 * Local maintainer checkouts may use the example identity; never claim generated provenance.
 * Set canonicalOrigin (or STOREFRONT_CANONICAL_ORIGIN) to the HTTPS deployment origin before release.
 */
export const standaloneSettings = {
  projectId: "123e4567-e89b-42d3-a456-426614174000",
  canonicalOrigin: "http://localhost:3000",
  assetOrigins: ["https://imagedelivery.net"],
  // Additional trusted hosts, excluding the primary NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN.
  checkoutOrigins: [] as string[],
  themeId: "hearth",
  presetId: "bakery-editorial",
  locale: "en-US",
  timeZone: "America/Los_Angeles",
  templateRelease: "0.1.0",
  configSchemaVersion: "1.0.0",
  capabilities: { loyalty: false },
  newsletter: null,
} satisfies Omit<ResolvedStorefrontConfig,
  "profile" | "tenantId" | "merchantSlug" | "apiBaseUrl">;
