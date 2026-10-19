import { afterEach, describe, expect, it, vi } from "vitest";
const runtime = vi.hoisted(() => vi.fn());
const merchant = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect, notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/tenant/server-storefront-runtime", () => ({ readRequestStorefrontRuntime: runtime }));
vi.mock("@/lib/storefront/server-store-directory", () => ({ getStorefrontServerStoreDirectory: async () => ({ merchant: { getBySlug: merchant } }) }));
import Home from "./page";
afterEach(() => vi.resetAllMocks());
describe("hosted menu entry", () => {
  it("opens the only merchant location without asking the visitor to choose it", async () => {
    runtime.mockResolvedValue({ mode: "live", config: { merchantSlug: "fresh-store" } });
    merchant.mockResolvedValue({ locations: [{ id: "only-location" }] });
    await Home();
    expect(merchant).toHaveBeenCalledWith("fresh-store");
    expect(redirect).toHaveBeenCalledWith("/only-location");
  });
  it("keeps a real location choice when multiple menus are available", async () => {
    runtime.mockResolvedValue({ mode: "live", config: { merchantSlug: "two-stores" } });
    merchant.mockResolvedValue({ locations: [{ id: "north" }, { id: "south" }] });
    await Home();
    expect(redirect).toHaveBeenCalledWith("/stores");
  });
});
