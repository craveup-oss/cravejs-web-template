"use client";

import { createBrowserStorefrontClient } from "./browser-client";
import { createStorefrontStoreDirectory } from "./store-directory";

export function getBrowserStoreDirectory() {
  return createStorefrontStoreDirectory(createBrowserStorefrontClient());
}
