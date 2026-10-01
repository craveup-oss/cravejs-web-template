import { standaloneEnvironment } from "../../fixtures/standalone-environment";
import { standaloneSettings } from "../../config/standalone-settings";
import { describe, expect, it } from "vitest";

import { fixtureHostedConfig } from "../../fixtures/storefront-config";
import {
  resolveStorefrontRuntime,
  StorefrontRuntimeError,
} from "./storefront-runtime";

function hostedConfig(
  tenantId: string,
  merchantSlug: string,
): Record<string, unknown> {
  return {
    ...fixtureHostedConfig,
    tenantId,
    merchantSlug,
    canonicalOrigin: `https://${merchantSlug}.example.test`,
  };
}

describe("storefront runtime", () => {
  it("preserves the labeled zero-network fixture runtime for both profiles", async () => {
    await expect(
      resolveStorefrontRuntime(
        { host: "ignored.example.test", pathname: "/" },
        {
          NODE_ENV: "test",
          STOREFRONT_RUNTIME_MODE: "fixture",
          STOREFRONT_FIXTURE_NETWORK: "deny",
          STOREFRONT_FIXTURE_TENANT: "fixture-base",
          STOREFRONT_PROFILE: "hosted-multitenant",
        },
      ),
    ).resolves.toMatchObject({
      mode: "fixture",
      config: { profile: "hosted-multitenant", merchantSlug: "fixture-base" },
    });
  });

  it("resolves a hosted tenant only from the exact request host", async () => {
    const tea = hostedConfig("tenant-tea", "tea");
    const burger = hostedConfig("tenant-burger", "burger");
    const environment = {
      NODE_ENV: "production",
      STOREFRONT_PROFILE: "hosted-multitenant",
      NEXT_PUBLIC_CRAVEUP_API_URL: "https://api.example.test",
      STOREFRONT_HOSTED_TENANTS_JSON: JSON.stringify({
        "tea.example.test": tea,
        "burger.example.test": burger,
      }),
    };

    await expect(
      resolveStorefrontRuntime(
        {
          host: "TEA.EXAMPLE.TEST:443",
          pathname: "/?merchantSlug=burger&theme=burger",
        },
        environment,
      ),
    ).resolves.toMatchObject({
      mode: "live",
      config: { tenantId: "tenant-tea", merchantSlug: "tea" },
    });
    await expect(
      resolveStorefrontRuntime(
        { host: "unknown.example.test", pathname: "/" },
        environment,
      ),
    ).resolves.toBeNull();
  });

  it("resolves standalone generated config without reading a hosted registry", async () => {
    await expect(
      resolveStorefrontRuntime(
        { host: "any-deployment.example.test", pathname: "/menu" },
        {
          NODE_ENV: "production",
          ...standaloneEnvironment,
          STOREFRONT_HOSTED_TENANTS_JSON: "not valid json",
        },
      ),
    ).resolves.toMatchObject({
      mode: "live",
      config: {
        profile: "standalone-cli",
        tenantId: `standalone:${standaloneSettings.projectId}`,
      },
    });
  });

  it("fails with an actionable error for a missing or malformed selected profile config", async () => {
    await expect(
      resolveStorefrontRuntime(
        { host: "tea.example.test", pathname: "/" },
        {
          NODE_ENV: "production",
          STOREFRONT_PROFILE: "hosted-multitenant",
          NEXT_PUBLIC_CRAVEUP_API_URL: "https://api.example.test",
          STOREFRONT_HOSTED_TENANTS_JSON: "{",
        },
      ),
    ).rejects.toThrow(StorefrontRuntimeError);

    await expect(
      resolveStorefrontRuntime(
        { host: "standalone.example.test", pathname: "/" },
        {
          NODE_ENV: "production",
          STOREFRONT_PROFILE: "standalone-cli",
          NEXT_PUBLIC_CRAVEUP_API_URL: "https://api.example.test",
        },
      ),
    ).rejects.toThrow(/NEXT_PUBLIC_CRAVEUP_LOCATION_ID/);
  });

  it("does not retain the obsolete merchant-only production fallback", async () => {
    await expect(
      resolveStorefrontRuntime(
        { host: "tea.example.test", pathname: "/" },
        {
          NODE_ENV: "production",
          NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG: "tea",
        },
      ),
    ).rejects.toThrow(/STOREFRONT_PROFILE/);
  });

  it("rejects a browser SDK API origin that disagrees with resolved config", async () => {
    await expect(
      resolveStorefrontRuntime(
        { host: "tea.example.test", pathname: "/" },
        {
          NODE_ENV: "production",
          STOREFRONT_PROFILE: "hosted-multitenant",
          NEXT_PUBLIC_CRAVEUP_API_URL: "https://wrong-api.example.test",
          STOREFRONT_HOSTED_TENANTS_JSON: JSON.stringify({
            "tea.example.test": hostedConfig("tenant-tea", "tea"),
          }),
        },
      ),
    ).rejects.toThrow(/NEXT_PUBLIC_CRAVEUP_API_URL.*apiBaseUrl/);
  });
});
