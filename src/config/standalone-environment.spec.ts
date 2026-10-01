import { standaloneSettings } from "./standalone-settings";
import { afterEach, describe, expect, it } from "vitest";
import { readStandaloneEnvironment } from "./standalone-environment";

const environment = {
  NEXT_PUBLIC_CRAVEUP_API_URL: "https://api.example.test",
  NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG: "tea",
  NEXT_PUBLIC_CRAVEUP_LOCATION_ID: "123e4567-e89b-42d3-a456-426614174001",
  NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN: "https://checkout.example.test",
};

afterEach(() => { Object.assign(standaloneSettings, { checkoutOrigins: [] }); });

describe("standalone public environment", () => {
  it("composes the four public settings with typed project settings", () => {
    expect(readStandaloneEnvironment(environment, "development")).toMatchObject({
      defaultLocationId: environment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID,
      config: { profile: "standalone-cli", merchantSlug: "tea", apiBaseUrl: environment.NEXT_PUBLIC_CRAVEUP_API_URL,
        checkoutOrigins: [environment.NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN] },
    });
  });
  it.each(Object.keys(environment))("requires %s", (key) => {
    expect(() => readStandaloneEnvironment({ ...environment, [key]: "" }, "development")).toThrow(key);
  });
  it.each(["demo", "0123456789abcdef01234567", "store/a?b", "🍵".repeat(128)])("accepts contract location ID %s", (id) => {
    expect(readStandaloneEnvironment({ ...environment, NEXT_PUBLIC_CRAVEUP_LOCATION_ID: id }, "development").defaultLocationId).toBe(id);
  });
  it.each([".", ".."])('rejects the non-routable default location %s without redirecting', (id) => {
    expect(() => readStandaloneEnvironment({ ...environment, NEXT_PUBLIC_CRAVEUP_LOCATION_ID: id }, "development")).toThrow(/cannot be used as a storefront entry route/);
  });
  it("rejects location IDs exceeding the public contract limit", () => {
    expect(() => readStandaloneEnvironment({ ...environment, NEXT_PUBLIC_CRAVEUP_LOCATION_ID: "a".repeat(129) }, "development")).toThrow(/LOCATION_ID/);
  });
  it("preserves additional trusted checkout origins from typed settings", () => {
    Object.assign(standaloneSettings, { checkoutOrigins: ["https://second-checkout.example.test"] });
    expect(readStandaloneEnvironment(environment, "development").config.checkoutOrigins).toEqual([
      environment.NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN, "https://second-checkout.example.test",
    ]);
  });
  it("validates additional checkout origins with the same HTTPS allowlist contract", () => {
    Object.assign(standaloneSettings, { checkoutOrigins: ["http://unsafe.example.test"] });
    expect(() => readStandaloneEnvironment(environment, "development")).toThrow(/checkoutOrigins/);
  });
  it.each(["http://checkout.example.test", "https://checkout.example.test/", "https://checkout.example.test/path"])("rejects unsafe checkout origin %s", (origin) => {
    expect(() => readStandaloneEnvironment({ ...environment, NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN: origin }, "development")).toThrow(/CHECKOUT_ORIGIN/);
  });
  it("rejects obsolete standalone JSON instead of silently mixing configuration", () => {
    expect(() => readStandaloneEnvironment({ ...environment, STOREFRONT_STANDALONE_CONFIG_JSON: "{}" }, "development")).toThrow(/no longer supported/);
  });
  it("requires a production canonical origin in project settings", () => {
    expect(() => readStandaloneEnvironment(environment, "production")).toThrow(/canonicalOrigin/);
  });
});
