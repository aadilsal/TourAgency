import { describe, expect, it } from "vitest";
import { fieldErrorMsgId, fieldHintId, isBlank } from "./requiredFields";

describe("isBlank (required-field check)", () => {
  it("treats missing, whitespace-only, NaN and empty arrays as blank", () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank("")).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank(Number.NaN)).toBe(true);
    expect(isBlank([])).toBe(true);
  });

  it("accepts real values, including 0 and false", () => {
    expect(isBlank("Hunza")).toBe(false);
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
    expect(isBlank(["a"])).toBe(false);
  });

  it("derives hint/error ids from the control id", () => {
    expect(fieldHintId("f1-title")).toBe("f1-title-hint");
    expect(fieldErrorMsgId("f1-title")).toBe("f1-title-error");
  });
});
