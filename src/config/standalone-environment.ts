import { standaloneSettings } from "./standalone-settings";
import { validateStorefrontConfig, type StorefrontRuntimeEnvironment } from "./validate-storefront-config";

/** Single standalone config path. Hosted tenant authority never reads these overrides. */
export function readStandaloneEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  runtimeEnvironment: StorefrontRuntimeEnvironment,
) {
  if (environment.STOREFRONT_STANDALONE_CONFIG_JSON !== undefined) {
    throw new Error("STOREFRONT_STANDALONE_CONFIG_JSON is no longer supported. Use the four NEXT_PUBLIC_CRAVEUP_* settings and src/config/standalone-settings.ts.");
  }
  function required(field: string) {
    const value = environment[field];
    if (!value || value !== value.trim()) {
      throw new Error(`${field} must be a non-empty value without surrounding whitespace.`);
    }
    return value;
  }
  const defaultLocationId = environment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID;
  // MerchantLocation.id is an opaque 1–128 character string in the pinned public contract.
  if (!defaultLocationId || Array.from(defaultLocationId).length > 128) {
    throw new Error("NEXT_PUBLIC_CRAVEUP_LOCATION_ID must contain 1–128 characters.");
  }
  // The identifier contract is broader than URL path-segment routability.
  // Browsers normalize both literal and percent-encoded dot segments to the root.
  if (defaultLocationId === "." || defaultLocationId === "..") {
    throw new Error("NEXT_PUBLIC_CRAVEUP_LOCATION_ID cannot be used as a storefront entry route when it is . or ..");
  }
  const checkoutOrigin = required("NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN");
  let checkout: URL;
  try { checkout = new URL(checkoutOrigin); } catch {
    throw new Error("NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN must be an exact HTTPS origin.");
  }
  if (checkout.protocol !== "https:" || checkoutOrigin !== checkout.origin) {
    throw new Error("NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN must be an exact HTTPS origin.");
  }
  const config = validateStorefrontConfig({
    ...standaloneSettings,
    profile: "standalone-cli",
    tenantId: `standalone:${standaloneSettings.projectId}`,
    canonicalOrigin: environment.STOREFRONT_CANONICAL_ORIGIN ?? standaloneSettings.canonicalOrigin,
    apiBaseUrl: required("NEXT_PUBLIC_CRAVEUP_API_URL"),
    merchantSlug: required("NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG"),
    checkoutOrigins: [checkoutOrigin, ...standaloneSettings.checkoutOrigins],
  }, runtimeEnvironment);
  return { config, defaultLocationId };
}
