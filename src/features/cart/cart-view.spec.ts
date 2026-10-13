import { expect, it } from "vitest";
import { fixtureCart } from "@/fixtures/cart";
import { getCartMessages } from "@/content/cart";
import { createCartPageView } from "./cart-view";

it("discloses the canonical tip and fees included in the displayed total", () => {
  const view = createCartPageView({name: "Bakery"}, getCartMessages("en-US"), {
    ...fixtureCart,
    subTotalFormatted: "$4.50", taxTotalFormatted: "$0.34",
    waiterTipTotalFormatted: "$0.90", serviceFeeTotalFormatted: "$0.02",
    enterpriseFeeTotalFormatted: "$0.00", fulfillmentMethodFeeTotalFormatted: "$0.00",
    orderTotalWithServiceFeeFormatted: "$5.76",
  });
  expect(view.summaryRows).toEqual(expect.arrayContaining([
    {id: "tip", label: "Tip", formattedValue: "$0.90"},
    {id: "service-fee", label: "Service fee", formattedValue: "$0.02"},
    {id: "platform-fee", label: "Platform fee", formattedValue: "$0.00"},
  ]));
  expect(view.formattedTotal).toBe("$5.76");
});
