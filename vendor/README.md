# Pinned Storefront SDK candidate

`craveup-storefront-sdk-2.1.0-catalog.0.tgz` is generated from the canonical
`craveup/craveup-turborepo` SDK at source commit `656eafbc9` using
`pnpm --filter @craveup/storefront-sdk build` and its
`scripts/create-release-package.mjs` staging owner. It is not a separately
maintained SDK or a public npm release. The SDK source and executable contract
remain the owners; never edit or patch this tarball directly.

The candidate retains the deployed customer login/menu protocol and exposes
catalog-change acceptance. It bundles public contract declarations, with no
runtime dependencies. The storefront updates its saved-payment/loyalty callers
to the canonical location-scoped API. SDK 4.0 cannot substitute for this
runtime's different login/menu contract.

Rebuild and verify the canonical package, stage it, then `npm pack --ignore-scripts`
the staged directory. Replace this artifact and update the lockfile together.
The lockfile records package integrity. This bounded candidate does not certify
the broader SDK operation catalog, whose source checkout has existing coverage
and typecheck mismatches with newer operations.
