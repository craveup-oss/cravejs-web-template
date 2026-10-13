import { describe, expect, it } from "vitest";
import { CatalogSourceError, type CatalogSource } from "./catalog-source";
import { CatalogNotFoundError, loadStoreHomeData } from "./load-store-home";

describe("location identity precedes parallel menu failure", () => {
  it("keeps a missing location not-found when its menu also rejects", async () => {
    const source: CatalogSource = {
      locations: { getById: async () => null },
      menus: { list: async () => { throw new CatalogSourceError("Menu missing", "unavailable"); } },
      products: { get: async () => null },
    };
    await expect(loadStoreHomeData("foreign-location", source)).rejects.toBeInstanceOf(CatalogNotFoundError);
  });

  it("preserves a menu outage for a known location", async () => {
    const failure = new CatalogSourceError("Menu unavailable", "unavailable");
    const source: CatalogSource = {
      locations: { getById: async () => ({ id: "known", name: "Known store" }) },
      menus: { list: async () => { throw failure; } },
      products: { get: async () => null },
    };
    await expect(loadStoreHomeData("known", source)).rejects.toBe(failure);
  });
});
