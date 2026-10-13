import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { LiveCartPage } from "./live-cart-page";
const f = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn(), scoped: vi.fn() }));
vi.mock("@/lib/storefront/session-store", () => ({ createMerchantCartSessionStore: (slug: string) => { f.scoped(slug); return { get: f.session }; } }));
vi.mock("@/lib/storefront/browser-client", () => ({ createBrowserStorefrontClient: () => ({ cart: { get: f.read } }) }));
vi.mock("./cart-controller", () => ({ CartController: ({ initialCart }: {initialCart: { id: string }}) => <p>Saved cart {initialCart.id}</p> }));
vi.mock("./cart-page", () => ({ CartPage: () => <p>Empty cart</p> }));
const props = { merchantSlug: "wizard", locationId: "location-a", locale: "en-US", location: { name: "Wizard" } };
function mount() { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><LiveCartPage {...props} /></SWRConfig>); }
beforeEach(() => { vi.clearAllMocks(); f.session.mockResolvedValue({cartId: "cart-a"}); f.read.mockResolvedValue({id: "cart-a", locationId: "location-a"}); });
afterEach(cleanup);
it("loads the existing merchant-scoped cart without starting a session", async () => {
  mount(); await screen.findByText("Saved cart cart-a"); expect(f.scoped).toHaveBeenCalledWith("wizard"); expect(f.session).toHaveBeenCalledWith("location-a"); expect(f.read).toHaveBeenCalledWith("location-a", "cart-a");
});
it("shows empty without requesting another tenant cart", async () => {
  f.session.mockResolvedValue(null); mount(); await screen.findByText("Empty cart"); expect(f.read).not.toHaveBeenCalled();
});
it("rejects a mismatched location", async () => {
  f.read.mockResolvedValue({id: "cart-a", locationId: "foreign-location"}); mount(); await screen.findByRole("heading", {name: "Cart unavailable"}); expect(screen.queryByText("Saved cart cart-a")).toBeNull();
});
it("does not turn a failed read into empty", async () => {
  f.read.mockRejectedValue(new Error("unavailable")); mount(); await screen.findByRole("alert"); expect(screen.queryByText("Empty cart")).toBeNull();
});
