import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StorefrontApiOriginProvider } from "@/lib/storefront/public-api-origin";
import { StorefrontPreview } from "./storefront-preview";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.location.hash = ""; });
it("renders the saved menu through a scoped grant without ordering controls", async () => {
  window.location.hash = "a".repeat(64);
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ location: { id: "location", restaurantDisplayName: "My restaurant" }, menus: [{ id: "menu", name: "Sample menu", categories: [{ id: "category", name: "Samples", products: [{ id: "product", name: "Sample Bowl", displayPrice: "USD 12.00" }] }] }] })));
  vi.stubGlobal("fetch", request);
  render(<StorefrontApiOriginProvider origin="https://tenant.example"><StorefrontPreview locationId="location" /></StorefrontApiOriginProvider>);
  expect(await screen.findByText("Sample Bowl")).toBeTruthy();
  expect(screen.getByText(/Orders are off/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /cart|order|checkout/i })).toBeNull();
  expect(request.mock.calls[0][0]).toBe("https://tenant.example/api/v1/storefront/locations/location/preview");
  expect(request.mock.calls[0][1].headers.Authorization).toBe(`Preview ${"a".repeat(64)}`);
});
it("does not fetch without a valid grant", async () => {
  const request = vi.fn(); vi.stubGlobal("fetch", request);
  render(<StorefrontApiOriginProvider origin="https://tenant.example"><StorefrontPreview locationId="location" /></StorefrontApiOriginProvider>);
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(request).not.toHaveBeenCalled();
});
