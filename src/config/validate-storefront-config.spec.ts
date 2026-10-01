import { describe, expect, it } from "vitest";

import {
  StorefrontConfigError,
  validateStorefrontConfig,
} from "./validate-storefront-config";

const projectId = "123e4567-e89b-42d3-a456-426614174000";
const newsletter = {
  heading: "Stay in the loop",
  emailLabel: "Email address",
  submitLabel: "Subscribe",
  consentCopy: "Get restaurant news and offers in your inbox.",
  successMessage: "Thanks for subscribing.",
} as const;

function createHostedConfig(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    profile: "hosted-multitenant",
    tenantId: "tenant-fixture-base",
    projectId: null,
    merchantSlug: "fixture-base",
    canonicalOrigin: "https://storefront.example.test",
    apiBaseUrl: "https://api.example.test",
    assetOrigins: ["https://assets.example.test"],
    checkoutOrigins: ["https://checkout.example.test"],
    themeId: "base",
    locale: "en-US",
    timeZone: "America/Los_Angeles",
    templateRelease: "0.1.0",
    configSchemaVersion: "1.0.0",
    capabilities: {
      loyalty: false,
    },
    newsletter,
    ...overrides,
  };
}

function createStandaloneConfig(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return createHostedConfig({
    profile: "standalone-cli",
    tenantId: `standalone:${projectId}`,
    projectId,
    ...overrides,
  });
}

describe("validateStorefrontConfig", () => {
  it("accepts a trusted bakery preset in either runtime profile", () => {
    for (const createConfig of [createHostedConfig, createStandaloneConfig]) {
      expect(validateStorefrontConfig(createConfig({ presetId: "bakery-editorial" }), "production").presetId).toBe("bakery-editorial");
      for (const presetId of ["unknown", "", null, ["bakery-editorial"]]) {
        expect(() => validateStorefrontConfig(createConfig({ presetId }), "production")).toThrow(/presetId/);
      }
    }
  });

  it("accepts valid hosted and standalone configurations", () => {
    expect(
      validateStorefrontConfig(createHostedConfig(), "production"),
    ).toMatchObject({
      profile: "hosted-multitenant",
      projectId: null,
    });
    expect(
      validateStorefrontConfig(createStandaloneConfig(), "production"),
    ).toMatchObject({
      profile: "standalone-cli",
      tenantId: `standalone:${projectId}`,
      projectId,
    });
  });

  it("uses release-owned locale and time-zone semantics", () => {
    for (const locale of ["not_a_locale", " en-US "]) {
      expect(() =>
        validateStorefrontConfig(
          createHostedConfig({ locale }),
          "production",
        ),
      ).toThrow(/locale/);
    }

    for (const timeZone of ["Mars/Olympus", " America\/Los_Angeles "]) {
      expect(() =>
        validateStorefrontConfig(
          createHostedConfig({ timeZone }),
          "production",
        ),
      ).toThrow(/timeZone/);
    }
  });

  it("returns valid exact newsletter copy unchanged", () => {
    expect(
      validateStorefrontConfig(createHostedConfig(), "production").newsletter,
    ).toEqual(newsletter);
    expect(
      validateStorefrontConfig(createStandaloneConfig(), "production").newsletter,
    ).toEqual(newsletter);
  });

  it("accepts an explicit null newsletter for both profiles", () => {
    expect(
      validateStorefrontConfig(
        createHostedConfig({ newsletter: null }),
        "production",
      ).newsletter,
    ).toBeNull();
    expect(
      validateStorefrontConfig(
        createStandaloneConfig({ newsletter: null }),
        "production",
      ).newsletter,
    ).toBeNull();
  });

  it("requires the newsletter field", () => {
    const missingNewsletter = createHostedConfig();
    delete missingNewsletter.newsletter;

    expect(() =>
      validateStorefrontConfig(missingNewsletter, "production"),
    ).toThrow(/newsletter/);
  });

  it("rejects malformed and oversized newsletter copy", () => {
    const missingNewsletterField = {
      heading: newsletter.heading,
      emailLabel: newsletter.emailLabel,
      submitLabel: newsletter.submitLabel,
      consentCopy: newsletter.consentCopy,
    };
    const invalidNewsletterValues = [
      missingNewsletterField,
      { ...newsletter, unexpected: "value" },
      { ...newsletter, heading: "" },
      { ...newsletter, heading: " heading" },
      { ...newsletter, heading: "heading " },
      { ...newsletter, heading: "   " },
      { ...newsletter, heading: 123 },
      { ...newsletter, emailLabel: 123 },
      { ...newsletter, submitLabel: 123 },
      { ...newsletter, consentCopy: 123 },
      { ...newsletter, successMessage: 123 },
      { ...newsletter, heading: "a".repeat(121) },
      { ...newsletter, emailLabel: "a".repeat(121) },
      { ...newsletter, submitLabel: "a".repeat(121) },
      { ...newsletter, consentCopy: "a".repeat(501) },
      { ...newsletter, successMessage: "a".repeat(501) },
    ];

    for (const value of invalidNewsletterValues) {
      expect(() =>
        validateStorefrontConfig(
          createHostedConfig({ newsletter: value }),
          "production",
        ),
      ).toThrow(/newsletter/);
    }
  });

  it("identifies invalid newsletter fields without echoing copy", () => {
    const invalidHeading = " confidential newsletter copy ";

    try {
      validateStorefrontConfig(
        createHostedConfig({
          newsletter: { ...newsletter, heading: invalidHeading },
        }),
        "production",
      );
      throw new Error("Expected newsletter validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(StorefrontConfigError);
      expect((error as Error).message).toContain("newsletter.heading");
      expect((error as Error).message).not.toContain(invalidHeading);
    }
  });

  it("rejects missing fields and unknown profiles", () => {
    const missingMerchant = createHostedConfig();
    delete missingMerchant.merchantSlug;

    expect(() =>
      validateStorefrontConfig(missingMerchant, "production"),
    ).toThrow(/merchantSlug/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({ profile: "unknown-profile" }),
        "production",
      ),
    ).toThrow(/profile/);
  });

  it("requires safe HTTPS origins in production", () => {
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          canonicalOrigin: "http://storefront.example.test",
        }),
        "production",
      ),
    ).toThrow(/canonicalOrigin/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          assetOrigins: ["https://*.example.test"],
        }),
        "production",
      ),
    ).toThrow(/assetOrigins/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          checkoutOrigins: [],
        }),
        "production",
      ),
    ).toThrow(/checkoutOrigins/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          checkoutOrigins: ["http://checkout.example.test"],
        }),
        "development",
      ),
    ).toThrow(/checkoutOrigins/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          checkoutOrigins: ["https://checkout.example.test/path"],
        }),
        "production",
      ),
    ).toThrow(/checkoutOrigins/);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({
          apiBaseUrl: "https://api.example.test/api/v1/storefront",
        }),
        "production",
      ),
    ).toThrow(/apiBaseUrl/);
  });

  it("accepts an evidence-backed empty asset-origin allowlist", () => {
    expect(
      validateStorefrontConfig(
        createHostedConfig({ assetOrigins: [] }),
        "production",
      ),
    ).toMatchObject({
      assetOrigins: [],
      checkoutOrigins: ["https://checkout.example.test"],
    });
  });

  it("enforces hosted and standalone tenant identity rules", () => {
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({ projectId }),
        "production",
      ),
    ).toThrow(/projectId/);
    expect(() =>
      validateStorefrontConfig(
        createStandaloneConfig({ projectId: "not-a-uuid" }),
        "production",
      ),
    ).toThrow(/projectId/);
    expect(() =>
      validateStorefrontConfig(
        createStandaloneConfig({ tenantId: "standalone:wrong" }),
        "production",
      ),
    ).toThrow(/tenantId/);
  });

  it("rejects secret or unsupported configuration fields", () => {
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({ apiKey: "must-not-be-configured" }),
        "production",
      ),
    ).toThrow(StorefrontConfigError);
    expect(() =>
      validateStorefrontConfig(
        createHostedConfig({ apiKey: "must-not-be-configured" }),
        "production",
      ),
    ).toThrow(/apiKey/);
  });
});
