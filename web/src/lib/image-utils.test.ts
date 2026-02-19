import { describe, expect, it } from "vitest";

import { isLikelyImageUrl } from "./image-utils";

describe("isLikelyImageUrl", () => {
  it("accepts http(s) URLs with image extensions", () => {
    expect(isLikelyImageUrl("https://example.com/image.jpg")).toBe(true);
    expect(isLikelyImageUrl("http://example.com/a/b/icon.webp?size=64")).toBe(true);
  });

  it("accepts extension-less http(s) URLs", () => {
    expect(isLikelyImageUrl("https://picsum.photos/300")).toBe(true);
    expect(isLikelyImageUrl("https://cdn.example.com/image")) .toBe(true);
  });

  it("rejects non-http URLs and plain text", () => {
    expect(isLikelyImageUrl("ftp://example.com/image.jpg")).toBe(false);
    expect(isLikelyImageUrl("/images/local.png")).toBe(false);
    expect(isLikelyImageUrl("not a url")).toBe(false);
  });
});
