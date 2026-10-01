import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { StoreHomeVariant } from "../catalog-types";
import { loadStoreHomeData } from "../server/load-store-home";
import { fixtureCatalogSource } from "../server/catalog-source";
import { resolveStorefrontPreset } from "@/presets/storefront-presets";
import { StoreHome } from "./store-home";

afterEach(cleanup);

describe("StoreHome", () => {
  it("keeps bakery product destinations and backend order in the featured menu", async () => {
    const source = await loadStoreHomeData("demo", fixtureCatalogSource);
    const items = source.featuredItems.slice(0, 2).map((item, index) => ({
      ...item,
      id: `bakery-product-${index}`,
      name: index === 0 ? "Butter croissant" : "Pain au chocolat",
      href: `/bakery-location/items/bakery-product-${index}`,
    }));
    const { container } = render(<StoreHome data={{ ...source, featuredItems: items }} variant="home" visualPreset={resolveStorefrontPreset("bakery-editorial")} />);
    const featured = container.querySelector<HTMLElement>("#most-ordered")!;
    expect(within(featured).getAllByRole("heading", { level: 3 }).map(({ textContent }) => textContent)).toEqual(items.map((item) => item.name));
    for (const item of items) expect(featured.querySelector(`a[href="${item.href}"]`)).not.toBeNull();
  });

  it.each<StoreHomeVariant>([
    "home",
    "category-scroll",
    "menu-categories",
    "full-menu",
  ])("renders the %s variant from one normalized data model", async (variant) => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    render(<StoreHome data={data} variant={variant} searchSlot={<div>Search slot</div>} />);

    expect(screen.getAllByText("Your Restaurant").length).toBeGreaterThan(0);
    if (variant === "menu-categories") {
      expect(screen.getByText("Menus")).toBeInTheDocument();
      expect(screen.queryByText("Search slot")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Most ordered" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Store details" })).not.toBeInTheDocument();
    } else {
      expect(screen.getByText("Search slot")).toBeInTheDocument();
      expect(screen.getAllByText(/Burgers|Most ordered/).length).toBeGreaterThan(0);
    }

    if (variant === "full-menu") {
      expect(screen.getAllByRole("link", { name: "Most ordered" }).length).toBeGreaterThan(0);
    }

    expect(screen.getByTestId("storefront-shell")).toHaveAttribute(
      "data-variant",
      variant,
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the store-home fulfillment summary and a bounded featured section", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    const { container } = render(<StoreHome data={data} variant="home" />);

    const summary = screen.getByLabelText("Store fulfillment summary");
    expect(summary).toHaveTextContent("Pickup fee");
    expect(summary).toHaveTextContent("$0");
    expect(container.querySelectorAll("#most-ordered .menu-item-card")).toHaveLength(6);
    const featured = container.querySelector<HTMLElement>("#most-ordered")!;
    expect(within(featured).getAllByRole("heading", { level: 3 }).map(({ textContent }) => textContent)).toEqual(
      data.featuredItems.slice(0, 6).map((item) => item.name),
    );
    expect(screen.getByRole("link", { name: "See all most ordered items" })).toHaveAttribute(
      "href",
      "#full-menu",
    );
    const featuredImages = [...featured.querySelectorAll("img")];
    expect(
      featuredImages
        .slice(0, 2)
        .every((image) =>
          image.getAttribute("loading") === "eager"
          && image.getAttribute("fetchpriority") === "low"
        ),
    ).toBe(true);
    expect(
      featuredImages
        .slice(2)
        .every((image) => image.getAttribute("loading") === "lazy"),
    ).toBe(true);
  });

  it("applies a visual preset without replacing the shared catalog model", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    const preset = resolveStorefrontPreset("sushi-atelier");
    const { container } = render(
      <StoreHome data={data} variant="home" visualPreset={preset} />,
    );

    expect(screen.getByTestId("storefront-shell")).toHaveAttribute(
      "data-preset",
      "sushi-atelier",
    );
    expect(container.querySelector(".storefront-preset-hero")).toHaveAttribute(
      "data-composition",
      "split-grid",
    );
    expect(
      container.querySelector(".store-hero img")?.getAttribute("src"),
    ).toBe(preset.heroImageSrc);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByText("Your Restaurant").length).toBeGreaterThan(0);
  });

  it("composes entry context and suppresses pickup metrics for table service", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    render(
      <StoreHome
        data={data}
        variant="home"
        entryContextSlot={<div>Table 12 context</div>}
        fulfillmentMode="table-side"
      />,
    );

    expect(screen.getByText("Table 12 context")).toBeInTheDocument();
    expect(screen.getByLabelText("Fulfillment method")).toHaveTextContent("Table service");
    expect(screen.queryByLabelText("Store fulfillment summary")).not.toBeInTheDocument();
  });

  it("renders category-scroll with a sticky category strip and seasonal list", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    const { container } = render(<StoreHome data={data} variant="category-scroll" />);

    expect(screen.getByRole("navigation", { name: "Browse sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seasonal menus" })).toBeInTheDocument();
    const seasonalImages = [...container.querySelectorAll("#seasonal-menus img")];
    expect(seasonalImages.map((image) => image.getAttribute("loading"))).toEqual([
      "lazy",
      "lazy",
      "lazy",
    ]);
  });

  it("renders menu categories with explicit service context", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    render(<StoreHome data={data} variant="menu-categories" />);

    expect(
      screen.getByRole("heading", { name: "Your Hotel In-Room Dining" }),
    ).toBeInTheDocument();
    expect(screen.getByText("12–22 min")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Menus" })).toBeInTheDocument();
    expect(screen.getByText("Buy 1, get 1 free for eligible items")).toBeInTheDocument();
    expect(screen.getByText("Your Hotel · Room 324")).toBeInTheDocument();
  });

  it("renders full-menu navigation without dead featured anchors", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    render(<StoreHome data={data} variant="full-menu" />);

    expect(screen.getByRole("navigation", { name: "Menu types" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Most ordered" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Most ordered" }).every((link) =>
      link.getAttribute("href") === "#most-ordered",
    )).toBe(true);
  });

  it("keeps full-menu category images lazy when the featured item owns discovery", async () => {
    const data = await loadStoreHomeData("demo", fixtureCatalogSource);
    const sourceItems = data.categories[0].items;
    const expandedItems = Array.from({ length: 8 }, (_, index) => ({
      ...sourceItems[index % sourceItems.length],
      id: `expanded-${index}`,
    }));
    const expandedData = {
      ...data,
      categories: [
        { ...data.categories[0], items: expandedItems },
        ...data.categories.slice(1),
      ],
    };
    const { container } = render(<StoreHome data={expandedData} variant="full-menu" />);

    const firstCategoryImages = [
      ...container.querySelectorAll(".full-menu-list section:first-child img"),
    ];
    expect(firstCategoryImages).toHaveLength(8);
    expect(firstCategoryImages.every((image) =>
      image.getAttribute("loading") === "lazy"
    )).toBe(true);
  });
});
