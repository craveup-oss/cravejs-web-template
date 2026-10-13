import type { ReactNode } from "react";

import { loadStorePicker } from "@/features/fulfillment/stores/load-store-picker";
import { StorefrontFooter } from "@/components/shell/storefront-footer";
import { StorefrontHeader } from "@/components/shell/storefront-header";
import { StorefrontSkipLink } from "@/components/shell/storefront-skip-link";
import { readRequestStorefrontRuntime } from "@/lib/tenant/server-storefront-runtime";

export interface AccountPageRuntime {
  readonly merchantSlug: string;
  readonly locale: string;
  readonly timeZone: string;
  readonly mode: "fixture" | "live";
}

export async function readAccountPageRuntime(): Promise<AccountPageRuntime | null> {
  const runtime = await readRequestStorefrontRuntime();
  if (!runtime) {
    return null;
  }

  return {
    merchantSlug: runtime.config.merchantSlug,
    locale: runtime.config.locale,
    timeZone: runtime.config.timeZone,
    mode: runtime.mode,
  };
}

export async function AccountPageShell({
  accountHref,
  children,
}: {
  readonly accountHref: string;
  readonly children: ReactNode;
}) {
  const runtime = await readAccountPageRuntime();
  const directory = runtime ? await loadStorePicker(runtime).catch(() => null) : null;
  const brand = directory?.merchantName ?? "Your account";
  const locationId = directory?.stores[0]?.id;
  const menuHref = locationId ? `/${encodeURIComponent(locationId)}` : "/stores";
  return (
    <div className="storefront-shell">
      <StorefrontSkipLink />
      <StorefrontHeader
        brand={brand}
        brandHref={menuHref}
        items={[
          { id: "menu", label: "Menu", href: "/" },
          { id: "locations", label: "Locations", href: "/stores" },
        ]}
        actionItems={[
          { id: "account", label: "Account", href: accountHref },
        ]}
        desktopAction={{
          id: "account",
          label: "Account",
          href: accountHref,
        }}
      />
      <main id="storefront-main" tabIndex={-1}>{children}</main>
      {locationId ? <StorefrontFooter brand={brand} menuHref={menuHref} /> : null}
    </div>
  );
}
