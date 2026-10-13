import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { StorefrontStoreDirectoryError } from "@/lib/storefront/store-directory";

const runtime = vi.hoisted(() => vi.fn());
const load = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/features/status/account-page", () => ({ readAccountPageRuntime: runtime }));
vi.mock("@/features/fulfillment/stores/load-store-picker", () => ({ loadStorePicker: load }));
vi.mock("@/components/shell/storefront-header", () => ({ StorefrontHeader: () => null }));
import StoresPage from "./page";

afterEach(() => vi.resetAllMocks());

it.each([null, { merchantName: "Configured merchant", stores: [] }])("renders a closed state for a configured live tenant without public stores: %j", async (data) => {
  runtime.mockResolvedValue({ mode: "live", merchantSlug: "configured" });
  load.mockResolvedValue(data);
  const html = renderToStaticMarkup(await StoresPage());
  expect(html).toContain("This store isn’t open yet");
  expect(html).toContain('action="/stores"');
});

it("keeps unknown tenants inaccessible without looking up a merchant", async () => {
  runtime.mockResolvedValue(null);
  await expect(StoresPage()).rejects.toThrow("NOT_FOUND");
  expect(load).not.toHaveBeenCalled();
});

it("does not mislabel a directory outage as an unpublished store", async () => {
  runtime.mockResolvedValue({ mode: "live", merchantSlug: "configured" });
  load.mockRejectedValue(new StorefrontStoreDirectoryError({ state: "network-error", code: "REQUEST_TIMEOUT", message: "Timeout" }));
  const html = renderToStaticMarkup(await StoresPage());
  expect(html).toContain("Stores are unavailable");
  expect(html).not.toContain("This store isn’t open yet");
});
