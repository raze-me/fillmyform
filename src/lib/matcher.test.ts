import { describe, expect, it } from "vitest";
import { matchField, normalizeText } from "./matcher";
import type { Profile } from "./schema";

const profile: Profile = {
  profileId: "test-profile",
  profileName: "Test Profile",
  lastUpdated: new Date().toISOString(),
  fields: [
    {
      fieldId: "full_name",
      label: "Full Name",
      synonyms: ["Name", "Your Name"],
      value: "Raze",
      type: "text",
      isCustom: false,
    },
    {
      fieldId: "email",
      label: "Email",
      synonyms: ["Email Address", "Mail"],
      value: "raze@example.com",
      type: "email",
      isCustom: false,
    },
    {
      fieldId: "phone",
      label: "Phone",
      synonyms: ["Phone Number", "Mobile Number"],
      value: "0987654321",
      type: "tel",
      isCustom: false,
    },
  ],
};

describe("matcher", () => {
  it("normalizes labels", () => {
    expect(normalizeText("Please enter your Email Address")).toBe(
      "email address",
    );
  });
  it("matches an exact field", () => {
    const result = matchField("Full Name", "text", profile);

    expect(result?.fieldId).toBe("full_name");
    expect(result?.confidence).toBe("high");
  });
});
