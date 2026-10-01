/** Public test configuration; no live tenant, tokens, or network credentials. */
export const standaloneEnvironment = {
  STOREFRONT_PROFILE: "standalone-cli",
  NEXT_PUBLIC_CRAVEUP_API_URL: "https://api.example.test",
  NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG: "fixture-base",
  NEXT_PUBLIC_CRAVEUP_LOCATION_ID: "123e4567-e89b-42d3-a456-426614174001",
  NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN: "https://checkout.example.test",
  STOREFRONT_CANONICAL_ORIGIN: "https://standalone.example.test",
};
