import CartPage from "@/app/(checkout)/[locationId]/cart/page";
import { StorefrontDialog } from "@/components/shell/storefront-dialog";
export default function CartOverlay(props: Parameters<typeof CartPage>[0]) {
  return <StorefrontDialog title="Your cart" kind="cart"><CartPage {...props} /></StorefrontDialog>;
}
