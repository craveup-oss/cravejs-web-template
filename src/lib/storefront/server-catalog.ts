import "server-only";

import {
  createStorefrontCatalogReader,
  type StorefrontCatalogReader,
} from "./catalog";

export async function getStorefrontServerCatalogReader(): Promise<StorefrontCatalogReader> {
  const { getStorefrontServerClient } = await import("./server-client");
  return createStorefrontCatalogReader((await getStorefrontServerClient()));
}
