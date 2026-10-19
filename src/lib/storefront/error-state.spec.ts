import { describe, expect, it } from "vitest";
import { toStorefrontErrorState } from "./error-state";

describe("browser transport failures", () => {
  it.each([
    "Failed to fetch",
    "Load failed",
    "NetworkError when attempting to fetch resource.",
  ])("preserves the existing same-request recovery path for %s", (message) => {
    expect(toStorefrontErrorState(new TypeError(message))).toMatchObject({
      state: "network-error",
      code: "NETWORK_ERROR",
    });
  });

  it("does not replay arbitrary programming errors as network failures", () => {
    expect(toStorefrontErrorState(new TypeError("Cannot read properties of undefined"))).toMatchObject({
      state: "unexpected",
      code: "UNKNOWN_ERROR",
    });
  });
});
