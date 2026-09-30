import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyDistributionBoundary } from "./verify-distribution-boundary.mjs";

function verifyReadmeLink(url) {
  const directory = mkdtempSync(join(tmpdir(), "storefront-host-check-"));
  try {
    mkdirSync(join(directory, "template"));
    writeFileSync(join(directory, "template", "README.md"), `[Website](${url})\n`);
    const ledger = join(directory, "ownership.json");
    writeFileSync(ledger, JSON.stringify({ assets: [] }));
    const archive = join(directory, "template.tar");
    execFileSync("tar", ["-cf", archive, "-C", directory, "template"]);
    return verifyDistributionBoundary(archive, ledger);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const host of ["developer.craveup.com", "docs.craveup.com", "api.craveup.com", "sandbox-api.craveup.com"]) {
  test(`README may link to the public ${host}`, () => {
    assert.equal(verifyReadmeLink(`https://${host}/templates#bakery`).members, 1);
  });
}

for (const host of ["dev.craveup.com", "developer-preview.craveup.com", "developer-internal.craveup.com", "staging.craveup.com", "preview-123.craveup.com", "internal.craveup.com", "sandbox-other.craveup.com", "dev-api-123456.craveup.com"]) {
  test(`README still rejects private or unapproved ${host}`, () => {
    assert.throws(() => verifyReadmeLink(`https://${host}/`), (error) =>
      ["UNFINALIZED_CRAVEUP_HOST", "INTERNAL_DEV_HOST"].includes(error.code));
  });
}
