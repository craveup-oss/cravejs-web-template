import { Children, isValidElement } from "react";
import { StoreHome } from "@/features/catalog/browse/store-home";
import { resolveFixtureRuntime } from "@/fixtures/fixture-runtime";
import * as serverRuntime from "@/lib/tenant/server-storefront-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import StorePage from "./page";
import * as catalogSources from "@/features/catalog/server/storefront-catalog-source";
import { fixtureCatalogSource } from "@/features/catalog/server/catalog-source";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function renderDemoPage() {
  return StorePage({
    params: Promise.resolve({ locationId: "demo" }),
    searchParams: Promise.resolve({}),
  });
}

describe("store page fixture boundary", () => {
  it.each(["hosted-multitenant", "standalone-cli"] as const)("uses the trusted preset on the %s ordering route without replacing catalog links", async (profile) => {
    vi.stubEnv("STOREFRONT_RUNTIME_MODE", "fixture");
    vi.stubEnv("STOREFRONT_PROFILE", profile);
    vi.stubEnv("STOREFRONT_FIXTURE_TENANT", "fixture-base");
    vi.stubEnv("STOREFRONT_FIXTURE_NETWORK", "deny");
    const runtime = resolveFixtureRuntime({ profile, tenant: "fixture-base" }, "test");
    vi.spyOn(serverRuntime, "readRequestStorefrontRuntime").mockResolvedValue({ ...runtime, config: { ...runtime.config, presetId: "bakery-editorial" } });
    const page = await renderDemoPage();
    const home = Children.toArray(page.props.children).find((child) => isValidElement(child) && child.type === StoreHome);
    expect(home).toBeDefined();
    if (!isValidElement<Parameters<typeof StoreHome>[0]>(home)) throw new Error("Missing storefront");
    expect(home.props.visualPreset?.id).toBe("bakery-editorial");
    expect(home.props.data.categories[0].items[0].href).toMatch(/^\/demo\/items\//);
  });

  it("does not fall back to fixture catalog data unless fixture mode is explicit", async () => {
    await expect(renderDemoPage()).rejects.toThrow(/STOREFRONT_PROFILE/);
  });

  it("renders fixture catalog data in the explicit fixture runtime", async () => {
    vi.stubEnv("STOREFRONT_RUNTIME_MODE", "fixture");
    vi.stubEnv("STOREFRONT_PROFILE", "hosted-multitenant");
    vi.stubEnv("STOREFRONT_FIXTURE_TENANT", "fixture-base");
    vi.stubEnv("STOREFRONT_FIXTURE_NETWORK", "deny");

    await expect(renderDemoPage()).resolves.toBeDefined();
  });
});


describe("API-backed bakery route", () => {
  it.each(["standalone-cli", "hosted-multitenant"] as const)("uses the catalog adapter with the bakery design in %s", async (profile) => {
    vi.stubEnv("STOREFRONT_RUNTIME_MODE", undefined);
    const fixture = resolveFixtureRuntime({ profile, tenant: "fixture-base" }, "test");
    vi.spyOn(serverRuntime, "readRequestStorefrontRuntime").mockResolvedValue({
      mode: "live", config: { ...fixture.config, presetId: "bakery-editorial" },
    });
    const read = vi.spyOn(catalogSources, "getStorefrontCatalogSource").mockResolvedValue(fixtureCatalogSource);
    const page = await renderDemoPage();
    expect(read).toHaveBeenCalledOnce();
    const home = Children.toArray(page.props.children).find((child) => isValidElement(child) && child.type === StoreHome);
    if (!isValidElement<Parameters<typeof StoreHome>[0]>(home)) throw new Error("Missing storefront");
    expect(home.props.visualPreset?.id).toBe("bakery-editorial");
    expect(home.props.data.categories[0].items[0].href).toMatch(/^\/demo\/items\//);
    expect(home.props.data.categories[0].items[0].href).not.toContain("#category-pastries");
  });
});
