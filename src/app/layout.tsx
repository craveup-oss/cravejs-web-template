import type { Metadata } from "next";

import { getStorefrontLocalePresentation } from "@/content/storefront-locale";
import { FixtureModeBanner } from "@/fixtures/fixture-mode-banner";
import { readRequestStorefrontRuntime } from "@/lib/tenant/server-storefront-runtime";
import { loadStorefrontMerchantDirectory } from "@/lib/tenant/server-storefront-seo";

import { StorefrontApiOriginProvider } from "@/lib/storefront/public-api-origin";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const runtime = await readRequestStorefrontRuntime();
  const merchant = runtime
    ? await loadStorefrontMerchantDirectory(runtime).catch(() => null)
    : null;
  const title = merchant ? `${merchant.name} | Order online` : "Crave Storefront";
  const description =
    merchant?.description || "Browse the menu and place your order online.";

  return {
    title,
    description,
    robots:
      runtime?.mode === "live" && merchant
        ? { index: true, follow: true }
        : { index: false, follow: false },
    ...(runtime
      ? {
          metadataBase: new URL(runtime.config.canonicalOrigin),
          openGraph: {
            type: "website",
            url: "/",
            title,
            description,
            siteName: merchant?.name,
          },
        }
      : {}),
  };
}

export default async function RootLayout({ children, overlay }: { children: React.ReactNode; overlay: React.ReactNode }) {
  const runtime = await readRequestStorefrontRuntime();
  const environment = process.env;
  const paymentKey = environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const paymentMode = paymentKey.startsWith('pk_test_') ? 'test' : paymentKey.startsWith('pk_live_') ? 'live' : undefined;
  const locale = getStorefrontLocalePresentation(
    runtime?.config.locale ?? "en",
  );

  return (
    <html
      lang={locale.lang}
      dir={locale.direction}
      data-theme={runtime?.config.themeId ?? "base"}
      data-payment-mode={paymentMode}
      data-storefront-preset={runtime?.config.presetId}
      data-crave-api-origin={runtime?.mode === "live" ? runtime.config.apiBaseUrl : undefined}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {runtime?.mode === "fixture" ? (
          <FixtureModeBanner runtime={runtime} />
        ) : null}
        {runtime?.mode === "live" && paymentMode === "test" ? (
          <aside className="sandbox-demo-banner" role="status">Test payments · No real charges</aside>
        ) : null}
        <StorefrontApiOriginProvider origin={runtime?.mode === "live" ? runtime.config.apiBaseUrl : null}>
          {children}
          {overlay}
        </StorefrontApiOriginProvider>
      </body>
    </html>
  );
}
