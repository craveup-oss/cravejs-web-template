import { createStorefrontClient } from "@craveup/storefront-sdk";
import { expect, it, vi } from "vitest";
import { createStorefrontCatalogReader } from "./catalog";

it("uses the SDK transport to browse a product without inventing an order time", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({
      id: "pastry", locationId: "bakery", name: "Pastry", description: "",
      images: [], price: "4.50", displayPrice: "$4.50", currency: "usd",
      modifierIds: [], modifiers: [],
    }),
  );
  const reader = createStorefrontCatalogReader(createStorefrontClient({
    baseUrl: "https://api.example.test", fetch,
  }));
  expect((await reader.products.get("bakery", "pastry"))?.id).toBe("pastry");
  const url = new URL(String(fetch.mock.calls[0]![0]));
  expect(url.pathname).toBe("/api/v1/storefront/locations/bakery/products/pastry");
  expect([...url.searchParams]).toEqual([["menuOnly", "true"]]);
  expect(new Headers(fetch.mock.calls[0]![1]?.headers).has("Authorization")).toBe(false);
});
