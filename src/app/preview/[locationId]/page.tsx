import type { Metadata } from "next";
import { StorefrontPreview } from "./storefront-preview";
export const metadata: Metadata = { title: "Storefront preview", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function PreviewPage({ params }: { params: Promise<{ locationId: string }> }) {
  return <StorefrontPreview locationId={(await params).locationId} />;
}
