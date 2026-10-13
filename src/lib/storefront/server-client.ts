import "server-only";

import { createStorefrontClient } from "@craveup/storefront-sdk";
import { cache } from "react";
import { readRequestStorefrontRuntime } from "../tenant/server-storefront-runtime";

// Request-scoped: never reuse another host's tenant configuration.
export const getStorefrontServerClient = cache(async () => {
  const runtime = await readRequestStorefrontRuntime();
  if (runtime?.mode !== "live") throw new Error("Live storefront configuration required");
  return createStorefrontClient({ baseUrl: runtime.config.apiBaseUrl });
});
