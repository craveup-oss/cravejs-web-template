import type { StorefrontCart } from "@craveup/storefront-sdk";

import { fixturePickupCart } from "@/fixtures/cart";

import type { StoreHomeData } from "../catalog-types";
import {
  fixtureCatalogSource,
  type CatalogMenuBundleRecord,
  type CatalogSource,
} from "./catalog-source";

export class CatalogNotFoundError extends Error {
  constructor(readonly locationId: string) {
    super(`Location ${locationId} was not found.`);
    this.name = "CatalogNotFoundError";
  }
}

function mapMenuBundle(
  locationId: string,
  bundle: CatalogMenuBundleRecord,
): Pick<StoreHomeData, "categories" | "featuredItems" | "menuCategories"> {
  const products = new Map(bundle.products.map((product) => [product.id, product]));

  const categories = bundle.categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    items: category.productIds.flatMap((productId) => {
      const product = products.get(productId);
      return product
        ? [
            {
              id: product.id,
              href: `/${encodeURIComponent(locationId)}/items/${encodeURIComponent(product.id)}`,
              name: product.name,
              description: product.description,
              imageSrc: product.imageSrc,
              formattedPrice: product.formattedPrice,
              availability: product.available ? ("available" as const) : ("unavailable" as const),
              categoryId: category.id,
              categoryName: category.name,
            },
          ]
        : [];
    }),
  }));

  const mappedById = new Map(
    categories.flatMap((category) => category.items).map((item) => [item.id, item]),
  );

  return {
    categories,
    featuredItems: bundle.featuredProductIds.flatMap((id) => {
      const item = mappedById.get(id);
      return item ? [item] : [];
    }),
    menuCategories: bundle.menuCategories.map((menu) => ({ ...menu })),
  };
}

export async function loadStoreHomeData(
  locationId: string,
  source: CatalogSource,
): Promise<StoreHomeData> {
  const [locationResult, menuResult] = await Promise.allSettled([
    source.locations.getById(locationId),
    source.menus.list(locationId, { menuOnly: true }),
  ]);

  // Both requests stay parallel, but a menu rejection must not mask the
  // authoritative missing-location result for a foreign or unknown store.
  if (locationResult.status === "rejected") throw locationResult.reason;
  const location = locationResult.value;
  if (!location) throw new CatalogNotFoundError(locationId);
  if (menuResult.status === "rejected") throw menuResult.reason;
  const menuBundle = menuResult.value;

  return {
    location,
    ...mapMenuBundle(locationId, menuBundle),
  };
}

export interface DemoStoreHomeData extends StoreHomeData {
  fixtureCart?: StorefrontCart;
}

export async function loadDemoStoreHomeData(locationId: string): Promise<DemoStoreHomeData> {
  const data = await loadStoreHomeData(locationId, fixtureCatalogSource);
  if (locationId !== "demo") return data;

  return {
    ...data,
    fixtureCart: fixturePickupCart,
    orderRail: {
      itemCountLabel: `${fixturePickupCart.totalQuantity} items`,
      totalLabel: fixturePickupCart.subTotalFormatted,
      items: fixturePickupCart.items.map((item) => ({
        id: item.id,
        name: item.name,
        formattedPrice: item.totalFormatted,
        imageSrc: item.imageUrl,
      })),
      rows: [
        { id: "subtotal", label: "Subtotal", formattedValue: fixturePickupCart.subTotalFormatted },
      ],
      formattedTotal: fixturePickupCart.orderTotalWithServiceFeeFormatted,
      actionLabel: "View cart",
    },
  };
}
