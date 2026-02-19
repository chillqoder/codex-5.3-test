# JSON Image Cleaner

Client-side Next.js SPA for cleaning JSON datasets based on image URL health.

The app runs fully in the browser:
- Upload or drag/drop any `.json` file.
- Auto-detect image URL candidates from nested object strings.
- Validate images with browser `Image()` loading, timeout handling, and URL result caching.
- Filter items by validation status (`All valid`, `Any valid`, `Some broken`, etc.).
- Bulk-select items and export selected records to a new JSON file.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- CSS Modules
- Vitest (unit tests)

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## How It Works

1. Upload `.json`.
2. If root is an array, it loads directly.
3. If root is an object, the app tries to auto-detect the primary array path.
4. If multiple arrays are found, choose a path manually (suggestions shown).
5. URLs are validated in parallel with bounded concurrency and deduped cache.
6. Use filters/tabs + bulk actions, then export selected objects.

## Sample Data

Sample files are included in `/samples`:
- `/samples/sample-array.json`
- `/samples/sample-object-with-multiple-arrays.json`

## Unit Tests

Required unit tests are included for:
- `findAllStrings` in `/src/lib/json-utils.test.ts`
- `isLikelyImageUrl` in `/src/lib/image-utils.test.ts`

Run:

```bash
npm run test
```
