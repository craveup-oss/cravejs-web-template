import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fixtureHostedConfig } from "./fixtures/storefront-config";
import { proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());
it("builds CSP from the same runtime tenant configuration and denies unknown hosts", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("STOREFRONT_PROFILE", "hosted-multitenant");
  vi.stubEnv("STOREFRONT_RUNTIME_MODE", undefined);
  for (const tenant of ["project-a", "project-b"]) {
    const origin = `https://${tenant}.example`;
    vi.stubEnv("STOREFRONT_HOSTED_TENANTS_JSON", JSON.stringify({ [`${tenant}.example`]: {
      ...fixtureHostedConfig, tenantId: tenant, merchantSlug: tenant,
      canonicalOrigin: origin, apiBaseUrl: origin, assetOrigins: [`https://images.${tenant}.example`],
    } }));
    const result = await proxy(new NextRequest(origin, { headers: { host: `${tenant}.example` } }));
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Security-Policy")).toContain(origin);
    expect(result.headers.get("Content-Security-Policy")).toContain(`https://images.${tenant}.example`);
    const foreign = await proxy(new NextRequest("https://foreign.example", { headers: { host: "foreign.example" } }));
    expect(foreign.status).toBe(404);
  }
});
it("returns a coarse failure for invalid runtime configuration", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("STOREFRONT_PROFILE", "hosted-multitenant");
  vi.stubEnv("STOREFRONT_RUNTIME_MODE", undefined);
  vi.stubEnv("STOREFRONT_HOSTED_TENANTS_JSON", "invalid-private-config");
  const result = await proxy(new NextRequest("https://project-a.example", { headers: { host: "project-a.example" } }));
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain("invalid-private-config");
});
