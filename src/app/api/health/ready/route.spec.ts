import { beforeEach, describe, expect, it, vi } from "vitest";
const { readRuntime } = vi.hoisted(() => ({ readRuntime: vi.fn() }));
vi.mock("@/lib/tenant/server-storefront-runtime", () => ({ readRequestStorefrontRuntime: readRuntime }));
import { GET } from "./route";

describe("container configuration readiness", () => {
  beforeEach(() => { readRuntime.mockReset(); });
  it("reports configured serving separately from browser ordering acceptance", async () => {
    readRuntime.mockResolvedValue({ mode: "live" });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ready", scope: "storefront_configuration", orderingVerified: false });
  });
  it.each([null, { mode: "fixture" }])("refuses absent or fixture runtime %s", async (runtime) => {
    readRuntime.mockResolvedValue(runtime);
    expect((await GET()).status).toBe(503);
  });
  it("does not disclose configuration errors", async () => {
    readRuntime.mockRejectedValue(new Error("private config"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private config");
  });
});
