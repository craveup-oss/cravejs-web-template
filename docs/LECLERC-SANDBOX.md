# Leclerc external-sandbox implementation

## Target

`leclerc-bakery.order.page` must serve `craveup-oss/cravejs-web-template`, not the
legacy restaurant starter. API: `https://sandbox-api.craveup.com`. Stripe platform:
Crave External Sandbox (`acct_1UA2sUI6U7F5B7BP`), test credentials and test webhooks.
Internal development is a separate backend/database/Stripe account.

## Implementation

The public-safe export is based on the source commit recorded in `.crave/source.json`.
Existing catalog, storefront SDK transport, tenant validation, checkout origin checks,
and bakery components are reused. The public branch's editorial styling and generated
photographs are retained. The retired standalone JSON configuration is removed in favor
of the current four public environment settings plus typed project settings.

The bakery preset applies to the ordering route, using backend product IDs, photos and
prices. `/menu` reuses the merchant-verified root entry. It cannot redirect to a location
outside the selected merchant. Sandbox pages identify themselves as test orders only.

## Provisioned identity

Created through the authenticated external-sandbox create-organization API, with
`mintApiKey: false`; verified by a read-only database query and the dashboard selector:

- Organization: `org_3K4jHR9vMrd7LB9KbUApmNahRxE`
- Merchant: `d1956ea0-7ad1-4eb7-8979-64dc771c8490`
- Slug: `leclerc-bakery-external-demo`
- Location: `9d385370-f553-4e7c-85a4-2e4b3e7bcb3f`

These are public resource identifiers, not credentials. The development bakery remains
separate; do not reuse its Stripe customers, prices, connected accounts or catalog IDs.

## Deployment settings

Use the four public settings in `.env.example`, `STOREFRONT_PROFILE=standalone-cli`,
and `STOREFRONT_CANONICAL_ORIGIN=https://leclerc-bakery.order.page`.
Unset `DESIGN_SYSTEM_PREVIEW`, fixture settings, and retired JSON config.
No administrator or Stripe secret belongs in this deployment. Backend operations use
operator authentication outside the public repository.

## Acceptance and promotion

1. Select this organization in the external-sandbox dashboard and refresh the CLI login.
2. Use canonical onboarding to configure fictional demo address, timezone, hours and
   pickup, import the two pastries, upload their generated photographs, and publish the
   catalog. Use real Stripe test resources for subscription and connected-account setup;
   never alter readiness flags directly or enable live payments.
3. Run `pnpm verify` and `pnpm build`. With deployment environment variables loaded, run
   `pnpm verify:sandbox-demo`; it requires public merchant/location/menu access and the
   published photographs. A build alone is not public API acceptance.
4. Verify browser CORS and customer-auth origin policy for `https://leclerc-bakery.order.page`.
   The backend storefront base is `sandbox.order.page`; do not assume another hostname
   inherits its access. Verify checkout handoff remains on `https://checkout.sandbox.order.page`.
5. Connect the bakery Vercel project to this OSS repository and reviewed branch/commit.
   Test a preview at desktop and mobile widths: menu, pastry details, cart and test checkout.
6. Promote only after acceptance. Record hostname, repository, branch, exact commit,
   deployment ID/READY state, HTTP status and browser outcome. Keep the old deployment
   available for rollback; do not delete or archive it as part of this change.

## Current limits

The source checks and production build pass locally. The dedicated tenant exists, but
public SDK acceptance is currently blocked by incomplete onboarding/publication. The
existing bakery hostname has not been changed. Do not label this a completed deployment.
