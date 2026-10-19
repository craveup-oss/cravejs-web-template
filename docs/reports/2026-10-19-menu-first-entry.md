# Menu-first storefront entry

A hosted storefront with one public location previously sent every visitor through Find a store. Root entry now resolves the canonical merchant directory and opens its sole location automatically. Multiple locations retain the chooser; explicitly configured locations still require verified merchant membership. Outages and unpublished stores retain recoverable states.

Live location pages in both hosted and standalone profiles now use the existing category cards and navigation in a menu-first composition. Products, search, fulfillment and cart remain available; sample bakery marketing and fictional seasonal/popularity sections do not precede the actual catalog. The visual preset continues to supply styling. Explicit design fixtures retain their editorial previews.

Reused owners: root directory lookup and tenant validation, StoreHome, CategorySections, fulfillment status, shared footer and existing menu card. No alternate catalog, cart or transport path was added. Removed behavior: unconditional hosted one-location chooser and default editorial hero/story on live ordering pages.

Validation: 116 component/route tests and 23 release-verifier tests pass; lint, type checking and production build pass. Hosted verification follows the exact image rollout and is recorded in the Console storefront image/entry report.
