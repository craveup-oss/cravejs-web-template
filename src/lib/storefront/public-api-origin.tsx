"use client";

import { createContext, useContext, type ReactNode } from "react";

const PublicApiOrigin = createContext<string | null>(null);

export function StorefrontApiOriginProvider({ origin, children }: { origin: string | null; children: ReactNode }) {
  return <PublicApiOrigin.Provider value={origin}>{children}</PublicApiOrigin.Provider>;
}

export function useStorefrontApiOrigin() {
  return useContext(PublicApiOrigin);
}
