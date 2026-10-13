import { afterEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ create: vi.fn(() => ({})) }));
vi.mock("@craveup/storefront-sdk", () => ({ createStorefrontClient: sdk.create }));
import { createBrowserStorefrontClient } from "./browser-client";

afterEach(() => {
  delete document.documentElement.dataset.craveApiOrigin;
  sdk.create.mockClear();
  vi.unstubAllEnvs();
});

describe("browser SDK runtime configuration", () => {
  it("reads each server-resolved origin rather than compiled environment", () => {
    vi.stubEnv("NEXT_PUBLIC_CRAVEUP_API_URL", "https://obsolete.example");
    for (const origin of ["https://project-a.example", "https://project-b.example"]) {
      document.documentElement.dataset.craveApiOrigin = origin;
      createBrowserStorefrontClient();
      expect(sdk.create).toHaveBeenLastCalledWith(expect.objectContaining({ baseUrl: origin }));
    }
  });
  it("fails closed without server configuration or with an unsafe origin", () => {
    expect(() => createBrowserStorefrontClient()).toThrow(/Storefront API origin/);
    for (const origin of ["http://remote.example", "https://user:pass@example.com", "https://example.com/path"]) {
      document.documentElement.dataset.craveApiOrigin = origin;
      expect(() => createBrowserStorefrontClient()).toThrow();
    }
    expect(sdk.create).not.toHaveBeenCalled();
  });
});
