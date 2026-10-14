import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StorefrontCart } from "@craveup/storefront-sdk";
import { fixturePickupCart } from "@/fixtures/cart";
import { CartController } from "./cart-controller";
const loader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("./cart-runtime", () => ({ loadCartMutationCoordinator: loader.load }));
import { CatalogChangeReview } from "./catalog-change-review";
import { createCartMutationCoordinator } from "./cart-mutation-coordinator";
import { createStorefrontCartActions, StorefrontCartActionError, type StorefrontCartActions } from "@/lib/storefront/cart-actions";
import { runPickupPreflight } from "@/features/checkout/pickup-preflight";

const evidence = { cartRevision: 1, catalogPublicationRevision: 1, resolvedCatalogSnapshotRevision: 1, commercePolicyRevision: 1, providerBindingRevision: null };
function changedCart(): StorefrontCart {
  return { ...fixturePickupCart, catalogRevalidation: {
    required: true, outcome: "confirmation_required", reasonCodes: ["PRICE_CHANGED"],
    snapshotEvidence: null, checkedAt: null, acknowledgedAt: null,
    changeSet: { version: 1, previous: evidence, current: { ...evidence, catalogPublicationRevision: 2 }, reasonCodes: ["PRICE_CHANGED"], blocking: true, reconfirmationRequired: true,
      invalidatedEvidence: { quote: true, benefits: true, paymentAuthorization: true },
      changes: [{ reason: "PRICE_CHANGED", cartItemId: fixturePickupCart.items[0].id, canonicalEntityId: fixturePickupCart.items[0].productId, path: "items.0.price", before: "13.00", after: "14.00", permittedActions: ["ACCEPT_CHANGES", "REMOVE_ITEM"] }],
    },
  } };
}
function actions(accept: StorefrontCartActions["acceptCatalogChanges"]): StorefrontCartActions {
  return { get: vi.fn(), addItem: vi.fn(), removeItem: vi.fn(), updateItemQuantity: vi.fn(), delete: vi.fn(), acceptCatalogChanges: accept };
}
const accepted = () => ({ ...changedCart(), revision: 2, catalogRevalidation: null });

describe("catalog change consent", () => {
  it("summarizes repeated menu revision evidence once without removing consent checks", () => {
    const cart = changedCart();
    for (let index = 0; index < 3; index++) cart.catalogRevalidation!.changeSet!.changes.push({ reason: "POLICY_CHANGED", cartItemId: null, canonicalEntityId: null, path: `revision.${index}`, before: 1, after: 2, permittedActions: ["ACCEPT_CHANGES"] });
    render(<CatalogChangeReview cart={cart} locale="en-US" pending={false} onAccept={vi.fn()} />);
    expect(screen.getAllByText("The menu was updated")).toHaveLength(1);
    expect(screen.getByText(/\$13.00 → \$14.00/)).toBeVisible();
  });

  it("keeps other cart writes disabled while an acceptance response is uncertain", async () => {
    const accept = vi.fn().mockRejectedValue(new StorefrontCartActionError({ state: "network-error", code: "NETWORK_ERROR", message: "Disconnected" }));
    loader.load.mockResolvedValue(createCartMutationCoordinator({ actions: actions(accept), initialCart: changedCart(), createIdempotencyKey: () => "accept-catalog-key-123" }));
    render(<CartController initialCart={changedCart()} runtime={{ mode: "live", merchantSlug: "test" }} locale="en-US" location={{ name: "Test" }} browseHref="/location" />);
    fireEvent.click(screen.getByRole("button", { name: "Accept changes" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Retry cart update" })).toBeVisible());
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Remove" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("shows authoritative old/new prices and never accepts on render", () => {
    const onAccept = vi.fn(); render(<CatalogChangeReview cart={changedCart()} locale="en-US" pending={false} onAccept={onAccept} />);
    expect(screen.getByText(/\$13.00 → \$14.00/)).toBeVisible(); expect(onAccept).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Accept changes" })); expect(onAccept).toHaveBeenCalledOnce();
  });
  it("requires editing unavailable items rather than accepting them", () => {
    const cart = changedCart(); cart.catalogRevalidation!.changeSet!.changes[0].permittedActions = ["REMOVE_ITEM"];
    render(<CatalogChangeReview cart={cart} locale="en-US" pending={false} onAccept={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Accept changes" })).toBeNull(); expect(screen.getByText(/Remove affected items/)).toBeVisible();
  });
  it("disables another acceptance while pending", () => {
    render(<CatalogChangeReview cart={changedCart()} locale="en-US" pending onAccept={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Updating order…" })).toBeDisabled();
  });
  it("keeps checkout blocked without writing customer or creating payment", async () => {
    const validateAndUpdateCustomer = vi.fn();
    const result = await runPickupPreflight({ cart: { get: vi.fn().mockResolvedValue(changedCart()), validateAndUpdateCustomer } }, { locationId: fixturePickupCart.locationId, cartId: fixturePickupCart.id, customer: { customerName: "Test", customerEmail: "test@example.test", lastName: "", phoneNumber: null }, idempotencyKey: "catalog-review-123" });
    expect(result).toMatchObject({ state: "blocked", reason: "catalog-changed" }); expect(validateAndUpdateCustomer).not.toHaveBeenCalled();
  });
  it("replays the same revision and idempotency key after a lost acceptance response", async () => {
    const accept = vi.fn().mockRejectedValueOnce(new StorefrontCartActionError({ state: "network-error", code: "NETWORK_ERROR", message: "Disconnected" })).mockResolvedValueOnce({ state: "succeeded", cart: accepted() });
    const coordinator = createCartMutationCoordinator({ actions: actions(accept), initialCart: changedCart(), createIdempotencyKey: () => "accept-catalog-key-123" });
    await expect(coordinator.acceptCatalogChanges({ intentId: "consent-1" })).rejects.toThrow();
    await coordinator.retryLostResponse("consent-1");
    expect(accept).toHaveBeenCalledTimes(2); expect(accept.mock.calls[0][0]).toEqual(accept.mock.calls[1][0]);
    expect(coordinator.getSnapshot().cart.id).toBe(fixturePickupCart.id);
  });
  it("shows a fresh cart on revision conflict and only retries with another explicit action", async () => {
    const refreshed = { ...changedCart(), revision: 2 };
    const accept = vi.fn().mockResolvedValueOnce({ state: "retry-required", cart: refreshed, error: { state: "cart-conflict", code: "CART_CONFLICT", message: "Changed" } }).mockResolvedValueOnce({ state: "succeeded", cart: { ...accepted(), revision: 3 } });
    let counter = 0;
    const coordinator = createCartMutationCoordinator({ actions: actions(accept), initialCart: changedCart(), createIdempotencyKey: () => `accept-catalog-key-${++counter}` });
    await coordinator.acceptCatalogChanges({ intentId: "consent-2" }); expect(accept).toHaveBeenCalledOnce(); expect(coordinator.getSnapshot().cart.revision).toBe(2);
    await coordinator.retryConflict("consent-2"); expect(accept.mock.calls[1][0]).toMatchObject({ revision: 2, idempotencyKey: "accept-catalog-key-2" });
  });
  it("does not redispatch a pending operation while observing unchanged evidence", async () => {
    const accept = vi.fn().mockRejectedValue(new StorefrontCartActionError({ state: "operation-pending", code: "IDEMPOTENCY_IN_PROGRESS", message: "Pending", retryAfterMs: 0 }));
    const owner = actions(accept); vi.mocked(owner.get).mockResolvedValue(changedCart());
    const coordinator = createCartMutationCoordinator({ actions: owner, initialCart: changedCart(), createIdempotencyKey: () => "accept-catalog-key-123" });
    await expect(coordinator.acceptCatalogChanges({ intentId: "consent-3" })).rejects.toThrow();
    await expect(coordinator.retryLostResponse("consent-3")).rejects.toThrow(); expect(accept).toHaveBeenCalledOnce(); expect(owner.get).toHaveBeenCalledOnce();
  });
  it("passes the exact consent revision and key through the existing SDK adapter", async () => {
    const acceptCatalogChanges = vi.fn().mockResolvedValue(accepted());
    const client = { cart: { get: vi.fn(), addItem: vi.fn(), removeItem: vi.fn(), updateItemQuantity: vi.fn(), delete: vi.fn(), acceptCatalogChanges } };
    await createStorefrontCartActions(client).acceptCatalogChanges({ locationId: "location", cartId: "cart", revision: 7, idempotencyKey: "accept-catalog-key-123" });
    expect(acceptCatalogChanges).toHaveBeenCalledWith("location", "cart", { revision: 7, idempotencyKey: "accept-catalog-key-123" });
  });
});
