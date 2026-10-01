import type { StoreHomeData } from "@/features/catalog/catalog-types";

// Visual content for the existing design-system preview only. The canonical
// ordering fixtures and their product IDs remain owned by src/fixtures.
const pastries = [
  {
    id: "butter-croissant",
    href: "#category-pastries",
    name: "Butter croissant",
    description: "Cultured butter, folded by hand. Crisp outside, impossibly light inside.",
    imageSrc: "/assets/template/bakery-croissant.webp",
    formattedPrice: "$4.50",
    availability: "available" as const,
    categoryId: "pastries",
    categoryName: "From the oven",
  },
  {
    id: "pain-au-chocolat",
    href: "#category-pastries",
    name: "Pain au chocolat",
    description: "Golden pastry wrapped around two batons of dark chocolate.",
    imageSrc: "/assets/template/bakery-pain-au-chocolat.webp",
    formattedPrice: "$5.25",
    availability: "available" as const,
    categoryId: "pastries",
    categoryName: "From the oven",
  },
];

export const bakeryPreviewData: StoreHomeData = {
  location: {
    id: "bakery-preview",
    name: "Leclerc Bakery",
    statusLabel: "Bakery design preview · Sample menu",
    heroImageSrc: "/assets/template/bakery-editorial-hero.webp",
  },
  categories: [{ id: "pastries", name: "From the oven", description: "Small batches. Every morning.", items: pastries }],
  featuredItems: pastries,
  menuCategories: [{ id: "pastries", name: "Pastries & viennoiserie", imageSrc: "/assets/template/bakery-croissant.webp" }],
};
