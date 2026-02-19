export type ImageValidationStatus = "loading" | "valid" | "broken" | "timeout";

export const IMAGE_EXTENSION_RE =
  /\.(?:jpe?g|png|gif|webp|avif|bmp)(?:\?.*)?$/i;

export function isLikelyImageUrl(input: string): boolean {
  const value = input.trim();
  // Any HTTP(S) URL is a candidate. Extension-less URLs are still validated.
  return /^https?:\/\//i.test(value);
}

export async function validateImageUrl(
  url: string,
  timeoutMs = 8_000,
): Promise<Exclude<ImageValidationStatus, "loading">> {
  if (typeof Image === "undefined") {
    return "broken";
  }

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;

    const finalize = (status: Exclude<ImageValidationStatus, "loading">) => {
      if (settled) {
        return;
      }

      settled = true;
      image.onload = null;
      image.onerror = null;
      clearTimeout(timer);
      resolve(status);
    };

    const timer = setTimeout(() => finalize("timeout"), timeoutMs);

    image.onload = () => finalize("valid");
    image.onerror = () => finalize("broken");
    image.decoding = "async";
    image.src = url;
  });
}
