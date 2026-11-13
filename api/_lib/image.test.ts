import { describe, expect, it } from "vitest";
import { validateImageDataUrl } from "./image";

const tinyJpegBase64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("validateImageDataUrl", () => {
  it("accepts a small valid JPEG data URL", () => {
    const url = `data:image/jpeg;base64,${tinyJpegBase64}`;
    expect(validateImageDataUrl(url)).toBe(url);
  });

  it.each([
    "not-a-data-url",
    "data:text/plain;base64,aGVsbG8=",
    "data:image/gif;base64,aGVsbG8=",
    "javascript:alert(1)",
  ])("rejects %s", (value) => {
    expect(() => validateImageDataUrl(value)).toThrow();
  });

  it("rejects a data URL larger than the cap", () => {
    const hugeBase64 = "A".repeat(800_000);
    expect(() => validateImageDataUrl(`data:image/jpeg;base64,${hugeBase64}`)).toThrow(/grande demais/);
  });
});
