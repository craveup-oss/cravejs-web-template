# Restore accepted hosted storefront source before publication work

The public main branch at d8b9d92978bfc3eebc132a79ac79c50941c2accc predates
October's accepted shared-hosting and checkout changes. This local branch restores
source/configuration from the retained guest-checkout-bakery-capability-20261008
snapshot before adding new storefront behavior. The original snapshot is untouched.

All six files in the parent checkout-capability-source-20261008.json manifest match
their recorded SHA-256 hashes. Imported trees are src/public plus package/lock,
Next/TypeScript/PostCSS/ESLint/Vitest configuration. No credentials, environment
files, node_modules or generated application artifacts were copied. Existing
repository release scripts, README and license attribution were preserved. There
were no obsolete src/public files left over from the public branch.

This imports previously implemented behavior rather than claiming new UI work:
shared runtime configuration, merchant-bound navigation, network-error recovery,
canonical cart capabilities and checkout handoff, and accepted bakery photography.

Baseline verification in the restored checkout: frozen dependency install passed;
15 Vitest files/87 tests and 23 release-script tests passed. This is local source
verification, not a new image acceptance or deployed behavior claim. No push,
publication, deployment, merchant data mutation or provider change was performed.

## Publication UX follow-up

Configured live tenants with no public merchant/locations now show “This store
isn’t open yet” with a reload action at the root and location picker. Foreign
location membership still fails closed; unknown tenant routing remains 404;
directory outages retain a retry error rather than being mislabeled unpublished.
This uses only the public directory; no draft catalog is fetched or exposed.

Local verification: 16 Vitest files / 93 tests plus 23 release checks pass;
ESLint and TypeScript pass after Next route type generation. Hosted acceptance
and the merchant publication-to-order journey remain unrun for this change.
