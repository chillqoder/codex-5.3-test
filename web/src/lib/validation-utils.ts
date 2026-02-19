import {
  type ImageValidationStatus,
  validateImageUrl,
} from "@/lib/image-utils";

interface ValidateUrlsOptions {
  concurrency?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onResult: (
    url: string,
    status: Exclude<ImageValidationStatus, "loading">,
  ) => void;
}

export async function validateUrlsWithConcurrency(
  urls: string[],
  options: ValidateUrlsOptions,
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 8, 10));

  if (urls.length === 0) {
    return;
  }

  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < urls.length) {
      if (options.signal?.aborted) {
        return;
      }

      const currentIndex = nextIndex;
      nextIndex += 1;

      const url = urls[currentIndex];
      const status = await validateImageUrl(url, timeoutMs);

      if (options.signal?.aborted) {
        return;
      }

      options.onResult(url, status);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    () => worker(),
  );

  await Promise.all(workers);
}
