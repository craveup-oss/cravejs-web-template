import { renderToStaticMarkup } from "react-dom/server";
import { StorefrontStoreDirectoryError } from "@/lib/storefront/store-directory";
import { standaloneEnvironment } from "@/fixtures/standalone-environment";
import { afterEach, describe, expect, it, vi } from "vitest";


const redirectSpy = vi.hoisted(() => vi.fn());
const notFoundSpy = vi.hoisted(() => vi.fn(() => { throw new Error("NOT_FOUND"); }));
const getMerchant = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: redirectSpy, notFound: notFoundSpy }));
vi.mock("@/lib/storefront/server-store-directory", () => ({
  getStorefrontServerStoreDirectory: async () => ({ merchant: { getBySlug: getMerchant } }),
}));

import Home from "./page";
import Menu from "./menu/page";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("storefront home route", () => {
  it("keeps the canonical demo location only in explicit fixture mode", async () => {
    vi.stubEnv("STOREFRONT_RUNTIME_MODE", "fixture");
    vi.stubEnv("STOREFRONT_PROFILE", "hosted-multitenant");
    vi.stubEnv("STOREFRONT_FIXTURE_TENANT", "fixture-base");
    vi.stubEnv("STOREFRONT_FIXTURE_NETWORK", "deny");

    await Home();

    expect(redirectSpy).toHaveBeenCalledWith("/demo");
  });

  it("opens the configured location after verifying merchant membership", async () => {
    vi.stubEnv("STOREFRONT_PROFILE", "standalone-cli");
    vi.stubEnv("NEXT_PUBLIC_CRAVEUP_API_URL", "https://api.example.test");
    for (const [key, value] of Object.entries(standaloneEnvironment)) vi.stubEnv(key, value);

    getMerchant.mockResolvedValue({ locations: [{ id: standaloneEnvironment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID }] });
    await Home();
    expect(redirectSpy).toHaveBeenCalledWith(`/${standaloneEnvironment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID}`);
    expect(getMerchant).toHaveBeenCalledWith(standaloneEnvironment.NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG);
  });
});

it("fails closed when the configured location belongs to another merchant", async () => {
  for (const [key, value] of Object.entries(standaloneEnvironment)) vi.stubEnv(key, value);
  getMerchant.mockResolvedValue({ locations: [{ id: "another-location" }] });
  await expect(Home()).rejects.toThrow("NOT_FOUND");
  expect(redirectSpy).not.toHaveBeenCalled();
});

it("encodes a contract-valid opaque location as one route segment", async () => {
  for (const [key, value] of Object.entries(standaloneEnvironment)) vi.stubEnv(key, value);
  vi.stubEnv("NEXT_PUBLIC_CRAVEUP_LOCATION_ID", "store/a?b");
  getMerchant.mockResolvedValue({ locations: [{ id: "store/a?b" }] });
  await Home();
  expect(redirectSpy).toHaveBeenCalledWith("/store%2Fa%3Fb");
});

it("menu entry uses the merchant-verified home route", () => { expect(Menu).toBe(Home); });

it("renders a recoverable timeout without redirecting to an unverified location", async () => {
  for (const [key, value] of Object.entries(standaloneEnvironment)) vi.stubEnv(key, value);
  getMerchant.mockRejectedValueOnce(new StorefrontStoreDirectoryError({
    state: "network-error", code: "REQUEST_TIMEOUT", message: "Request timed out",
  }));
  const page = await Home();
  const html = renderToStaticMarkup(page);
  expect(html).toContain("The menu is taking longer than expected");
  expect(html).toContain('action="/"');
  expect(html).toContain('method="get"');
  expect(html).toContain("Try again");
  expect(getMerchant).toHaveBeenCalledTimes(1);
  expect(redirectSpy).not.toHaveBeenCalled();

  getMerchant.mockResolvedValueOnce({ locations: [{ id: standaloneEnvironment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID }] });
  await Home();
  expect(redirectSpy).toHaveBeenCalledWith(`/${standaloneEnvironment.NEXT_PUBLIC_CRAVEUP_LOCATION_ID}`);
});

it("does not disguise unexpected application errors as a timeout", async () => {
  for (const [key, value] of Object.entries(standaloneEnvironment)) vi.stubEnv(key, value);
  getMerchant.mockRejectedValueOnce(new Error("unexpected bug"));
  await expect(Home()).rejects.toThrow("unexpected bug");
});
