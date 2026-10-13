import ItemPage from "@/app/(store)/[locationId]/items/[productId]/page";
import { StorefrontDialog } from "@/components/shell/storefront-dialog";
export default function ProductOverlay(props: Parameters<typeof ItemPage>[0]) {
  return <StorefrontDialog title="Menu item" kind="product"><ItemPage {...props} /></StorefrontDialog>;
}
