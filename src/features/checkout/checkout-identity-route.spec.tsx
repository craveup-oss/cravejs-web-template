import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutIdentityRoute, type CheckoutIdentityRouteProps } from "./checkout-identity-route";
vi.mock("./checkout-identity", () => ({CheckoutIdentity: () => <p>Customer sign in</p>}));
vi.mock("./pickup-checkout-preflight", () => ({PickupCheckoutPreflight: ({identity}: {identity: unknown}) => <output data-testid="contact">{JSON.stringify(identity)}</output>}));
vi.mock("./tableside-checkout-preflight", () => ({TablesideCheckoutPreflight: () => null}));
const props = {merchantSlug:"bakery",locationId:"location-one",locale:"en-US",mode:"live",backHref:"/location-one/cart",checkoutConfig:{merchantSlug:"bakery",checkoutOrigins:["https://bakery.example"]},orderTimes:{},orderTimeRuntime:{}} as unknown as CheckoutIdentityRouteProps;
describe("guest checkout contact", () => {
 it("passes contact to canonical preflight without creating a customer identity", () => {
  render(<CheckoutIdentityRoute {...props}/>);
  fireEvent.change(screen.getByLabelText("Name"),{target:{value:"Sandbox Guest"}});
  fireEvent.change(screen.getByLabelText("Email"),{target:{value:"sandbox@example.com"}});
  fireEvent.click(screen.getByRole("button",{name:"Continue as guest"}));
  expect(JSON.parse(screen.getByTestId("contact").textContent!)).toEqual({profile:{customerName:"Sandbox Guest",customerEmail:"sandbox@example.com",lastName:"",phoneNumber:null}});
  expect(screen.queryByText("Customer sign in")).not.toBeInTheDocument();
 });
 it("retains explicit customer sign in", () => {
  render(<CheckoutIdentityRoute {...props}/>);
  fireEvent.click(screen.getByRole("button",{name:"Sign in instead"}));
  expect(screen.getByText("Customer sign in")).toBeInTheDocument();
 });
 it("does not carry guest contact into a different installation", () => {
  const view=render(<CheckoutIdentityRoute {...props}/>);
  fireEvent.change(screen.getByLabelText("Name"),{target:{value:"Sandbox Guest"}});
  fireEvent.change(screen.getByLabelText("Email"),{target:{value:"sandbox@example.com"}});
  fireEvent.click(screen.getByRole("button",{name:"Continue as guest"}));
  view.rerender(<CheckoutIdentityRoute {...props} merchantSlug="other" locationId="location-two"/>);
  expect(screen.getByLabelText("Name")).toHaveValue("");
  expect(screen.queryByTestId("contact")).not.toBeInTheDocument();
 });
});
