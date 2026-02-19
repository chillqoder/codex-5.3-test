"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import {
  findAllStrings,
  normalizeArrayRoot,
  type ArrayPathCandidate,
} from "@/lib/json-utils";
import {
  isLikelyImageUrl,
  type ImageValidationStatus,
} from "@/lib/image-utils";
import { validateUrlsWithConcurrency } from "@/lib/validation-utils";
import type {
  FilterTab,
  ItemValidationSummary,
  Metrics,
  ParsedItem,
} from "@/types/json-cleaner";
import styles from "./JsonImageCleanerApp.module.css";

const TAB_CONFIG: Array<{ key: FilterTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "all_valid", label: "All valid" },
  { key: "any_valid", label: "Any valid" },
  { key: "some_broken", label: "Some broken" },
  { key: "all_broken", label: "All broken" },
  { key: "no_images", label: "No images" },
  { key: "selected", label: "Selected" },
];

const STATUS_LABELS: Record<ItemValidationSummary["status"], string> = {
  all_valid: "All valid",
  any_valid: "Any valid",
  all_broken: "All broken",
  some_broken: "Some broken",
  no_images: "No images",
};

const IMAGE_STATUS_LABELS: Record<ImageValidationStatus, string> = {
  loading: "Loading",
  valid: "Valid",
  broken: "Broken",
  timeout: "Timeout",
};

type FinalImageStatus = Exclude<ImageValidationStatus, "loading">;

interface PendingPathSelection {
  fileName: string;
  root: unknown;
  candidates: ArrayPathCandidate[];
  suggestedPath: string | null;
}

interface GalleryModalState {
  itemId: string;
  index: number;
}

function toSafeJsonString(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{\n  \"error\": \"Unable to render JSON\"\n}";
  }
}

function createItemTitle(value: unknown, index: number): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return `#${index + 1}`;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["title", "name", "id"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }

    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return `#${index + 1}`;
}

function buildParsedItems(input: unknown[]): ParsedItem[] {
  return input.map((item, index) => {
    const imageCandidates = Array.from(
      new Set(
        findAllStrings(item)
          .map((entry) => entry.value.trim())
          .filter((value) => isLikelyImageUrl(value)),
      ),
    );

    return {
      id: `item-${index}`,
      index,
      title: createItemTitle(item, index),
      original: item,
      imageCandidates,
      jsonString: toSafeJsonString(item),
    };
  });
}

function summarizeItem(
  item: ParsedItem,
  urlStatusMap: Record<string, ImageValidationStatus>,
): ItemValidationSummary {
  const totalImages = item.imageCandidates.length;
  if (totalImages === 0) {
    return {
      totalImages,
      validCount: 0,
      brokenCount: 0,
      timeoutCount: 0,
      loadingCount: 0,
      status: "no_images",
      progress: 1,
    };
  }

  let validCount = 0;
  let brokenCount = 0;
  let timeoutCount = 0;
  let loadingCount = 0;

  for (const url of item.imageCandidates) {
    const status = urlStatusMap[url] ?? "loading";
    if (status === "valid") {
      validCount += 1;
      continue;
    }

    if (status === "broken") {
      brokenCount += 1;
      continue;
    }

    if (status === "timeout") {
      timeoutCount += 1;
      continue;
    }

    loadingCount += 1;
  }

  const totalBroken = brokenCount + timeoutCount;

  let status: ItemValidationSummary["status"];
  if (validCount === totalImages) {
    status = "all_valid";
  } else if (validCount > 0 && totalBroken > 0) {
    status = "some_broken";
  } else if (validCount > 0) {
    status = "any_valid";
  } else if (totalBroken === totalImages) {
    status = "all_broken";
  } else if (totalBroken > 0) {
    status = "some_broken";
  } else {
    status = "any_valid";
  }

  return {
    totalImages,
    validCount,
    brokenCount,
    timeoutCount,
    loadingCount,
    status,
    progress: (validCount + totalBroken) / totalImages,
  };
}

function matchesTab(
  tab: FilterTab,
  summary: ItemValidationSummary,
  isSelected: boolean,
): boolean {
  switch (tab) {
    case "all":
      return true;
    case "all_valid":
      return summary.status === "all_valid";
    case "any_valid":
      return summary.validCount > 0;
    case "some_broken":
      return summary.validCount > 0 && summary.brokenCount + summary.timeoutCount > 0;
    case "all_broken":
      return (
        summary.totalImages > 0 &&
        summary.validCount === 0 &&
        summary.loadingCount === 0 &&
        summary.brokenCount + summary.timeoutCount === summary.totalImages
      );
    case "no_images":
      return summary.status === "no_images";
    case "selected":
      return isSelected;
    default:
      return true;
  }
}

function formatDateForFileName(date = new Date()): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read JSON file."));
    };

    reader.onerror = () => reject(new Error("Unable to read JSON file."));
    reader.readAsText(file);
  });
}

export default function JsonImageCleanerApp() {
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedPreviewIds, setExpandedPreviewIds] = useState<Set<string>>(new Set());

  const [fullJsonModalItemId, setFullJsonModalItemId] = useState<string | null>(null);
  const [galleryModalState, setGalleryModalState] = useState<GalleryModalState | null>(
    null,
  );

  const [pendingPathSelection, setPendingPathSelection] =
    useState<PendingPathSelection | null>(null);
  const [pathInput, setPathInput] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [urlStatuses, setUrlStatuses] = useState<Record<string, ImageValidationStatus>>(
    {},
  );
  const [validationProgress, setValidationProgress] = useState({
    validated: 0,
    total: 0,
    running: false,
  });

  const cacheRef = useRef<Map<string, FinalImageStatus>>(new Map());
  const activeScanIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const itemSummaryMap = useMemo(() => {
    const map = new Map<string, ItemValidationSummary>();
    for (const item of items) {
      map.set(item.id, summarizeItem(item, urlStatuses));
    }
    return map;
  }, [items, urlStatuses]);

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: items.length,
      all_valid: 0,
      any_valid: 0,
      some_broken: 0,
      all_broken: 0,
      no_images: 0,
      selected: 0,
    };

    for (const item of items) {
      const summary = itemSummaryMap.get(item.id);
      if (!summary) {
        continue;
      }

      const selected = selectedIds.has(item.id);
      if (selected) {
        counts.selected += 1;
      }
      if (summary.status === "all_valid") {
        counts.all_valid += 1;
      }
      if (summary.validCount > 0) {
        counts.any_valid += 1;
      }
      if (summary.validCount > 0 && summary.brokenCount + summary.timeoutCount > 0) {
        counts.some_broken += 1;
      }
      if (
        summary.totalImages > 0 &&
        summary.validCount === 0 &&
        summary.loadingCount === 0 &&
        summary.brokenCount + summary.timeoutCount === summary.totalImages
      ) {
        counts.all_broken += 1;
      }
      if (summary.status === "no_images") {
        counts.no_images += 1;
      }
    }

    return counts;
  }, [items, itemSummaryMap, selectedIds]);

  const metrics = useMemo<Metrics>(() => {
    let noImages = 0;
    let withAnyValid = 0;
    let allValid = 0;
    let withAnyBroken = 0;

    for (const item of items) {
      const summary = itemSummaryMap.get(item.id);
      if (!summary) {
        continue;
      }

      if (summary.status === "no_images") {
        noImages += 1;
      }
      if (summary.validCount > 0) {
        withAnyValid += 1;
      }
      if (summary.status === "all_valid") {
        allValid += 1;
      }
      if (summary.brokenCount + summary.timeoutCount > 0) {
        withAnyBroken += 1;
      }
    }

    return {
      totalItems: items.length,
      noImages,
      withAnyValid,
      allValid,
      withAnyBroken,
      selected: selectedIds.size,
    };
  }, [items, itemSummaryMap, selectedIds]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const summary = itemSummaryMap.get(item.id);
      if (!summary) {
        return false;
      }

      return matchesTab(activeTab, summary, selectedIds.has(item.id));
    });
  }, [activeTab, itemSummaryMap, items, selectedIds]);

  const fullJsonModalItem = useMemo(
    () => items.find((item) => item.id === fullJsonModalItemId) ?? null,
    [fullJsonModalItemId, items],
  );

  const galleryModalItem = useMemo(
    () =>
      galleryModalState
        ? items.find((item) => item.id === galleryModalState.itemId) ?? null
        : null,
    [galleryModalState, items],
  );

  const galleryCurrentIndex = galleryModalState?.index ?? 0;

  const runValidationForItems = useCallback(
    (targetItems: ParsedItem[], forceRescan = false) => {
      const uniqueUrls = Array.from(
        new Set(targetItems.flatMap((item) => item.imageCandidates)),
      );

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (forceRescan) {
        cacheRef.current.clear();
      }

      if (uniqueUrls.length === 0) {
        setUrlStatuses({});
        setValidationProgress({ validated: 0, total: 0, running: false });
        return;
      }

      const initialStatusMap: Record<string, ImageValidationStatus> = {};
      const uncachedUrls: string[] = [];
      let validatedFromCache = 0;

      for (const url of uniqueUrls) {
        const cached = cacheRef.current.get(url);
        if (cached) {
          initialStatusMap[url] = cached;
          validatedFromCache += 1;
        } else {
          initialStatusMap[url] = "loading";
          uncachedUrls.push(url);
        }
      }

      setUrlStatuses(initialStatusMap);
      setValidationProgress({
        validated: validatedFromCache,
        total: uniqueUrls.length,
        running: uncachedUrls.length > 0,
      });

      if (uncachedUrls.length === 0) {
        return;
      }

      const currentScanId = activeScanIdRef.current + 1;
      activeScanIdRef.current = currentScanId;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      void validateUrlsWithConcurrency(uncachedUrls, {
        concurrency: 8,
        timeoutMs: 8_000,
        signal: controller.signal,
        onResult: (url, status) => {
          if (activeScanIdRef.current !== currentScanId) {
            return;
          }

          cacheRef.current.set(url, status);

          setUrlStatuses((prev) => ({
            ...prev,
            [url]: status,
          }));

          setValidationProgress((prev) => {
            const nextValidated = Math.min(prev.total, prev.validated + 1);
            return {
              total: prev.total,
              validated: nextValidated,
              running: nextValidated < prev.total,
            };
          });
        },
      })
        .catch(() => {
          if (activeScanIdRef.current === currentScanId) {
            setErrorMessage("Image validation failed before completion.");
          }
        })
        .finally(() => {
          if (activeScanIdRef.current === currentScanId) {
            setValidationProgress((prev) => ({
              ...prev,
              running: false,
              validated: prev.total,
            }));
          }
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        });
    },
    [],
  );

  const setDataset = useCallback(
    (array: unknown[], path: string | null, fileName: string) => {
      const parsedItems = buildParsedItems(array);
      setItems(parsedItems);
      runValidationForItems(parsedItems, false);
      setSourcePath(path);
      setSourceFileName(fileName);
      setSelectedIds(new Set());
      setExpandedPreviewIds(new Set());
      setActiveTab("all");
      setPendingPathSelection(null);
      setPathInput("");
      setErrorMessage(null);
      setNoticeMessage(
        `Loaded ${parsedItems.length} items from ${fileName}${path ? ` (${path})` : ""}.`,
      );
    },
    [runValidationForItems],
  );

  const resolveRoot = useCallback(
    (root: unknown, fileName: string, explicitPath?: string) => {
      const result = normalizeArrayRoot(root, explicitPath);

      if (result.array) {
        setDataset(result.array, result.path, fileName);
        return;
      }

      if (result.requiresPathSelection) {
        setPendingPathSelection({
          fileName,
          root,
          candidates: result.pathCandidates,
          suggestedPath: result.suggestedPath,
        });
        setPathInput(result.suggestedPath ?? "");
        setErrorMessage(null);
        setNoticeMessage(result.error);
        return;
      }

      setErrorMessage(result.error ?? "Could not find an array in this JSON file.");
      setNoticeMessage(null);
    },
    [setDataset],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullJsonModalItemId(null);
        setGalleryModalState(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".json")) {
        setErrorMessage("Please upload a .json file.");
        setNoticeMessage(null);
        return;
      }

      setErrorMessage(null);
      setNoticeMessage("Parsing JSON file...");

      try {
        const text = await readFileAsText(file);
        const root = JSON.parse(text) as unknown;
        resolveRoot(root, file.name);
      } catch {
        setErrorMessage("Invalid JSON file. Please check formatting and retry.");
        setNoticeMessage(null);
      }
    },
    [resolveRoot],
  );

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      await processFile(file);
      event.target.value = "";
    },
    [processFile],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) {
        return;
      }

      await processFile(file);
    },
    [processFile],
  );

  const applyPathSelection = useCallback(() => {
    if (!pendingPathSelection) {
      return;
    }

    const selectedPath = pathInput.trim();
    if (!selectedPath) {
      setErrorMessage("Please enter a valid JSON path.");
      return;
    }

    resolveRoot(pendingPathSelection.root, pendingPathSelection.fileName, selectedPath);
  }, [pathInput, pendingPathSelection, resolveRoot]);

  const toggleItemSelection = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const selectIds = useCallback((ids: string[], mode: "replace" | "append") => {
    setSelectedIds((prev) => {
      const next = mode === "replace" ? new Set<string>() : new Set(prev);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const requireConfirmation = useCallback((count: number, label: string): boolean => {
    if (count < 250) {
      return true;
    }

    return window.confirm(`${label} ${count} items?`);
  }, []);

  const onSelectCurrentTab = useCallback(() => {
    const ids = visibleItems.map((item) => item.id);
    if (!requireConfirmation(ids.length, "Select")) {
      return;
    }
    selectIds(ids, "append");
  }, [requireConfirmation, selectIds, visibleItems]);

  const onSelectAnyValid = useCallback(() => {
    const ids = items
      .filter((item) => {
        const summary = itemSummaryMap.get(item.id);
        return Boolean(summary && summary.validCount > 0);
      })
      .map((item) => item.id);

    if (!requireConfirmation(ids.length, "Select")) {
      return;
    }

    selectIds(ids, "append");
  }, [itemSummaryMap, items, requireConfirmation, selectIds]);

  const onSelectOnlyValid = useCallback(() => {
    const ids = items
      .filter((item) => itemSummaryMap.get(item.id)?.status === "all_valid")
      .map((item) => item.id);

    if (!requireConfirmation(ids.length, "Select")) {
      return;
    }

    selectIds(ids, "append");
  }, [itemSummaryMap, items, requireConfirmation, selectIds]);

  const onDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const onInvertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const item of items) {
        if (!prev.has(item.id)) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [items]);

  const onDownloadSelected = useCallback(() => {
    const selected = items.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) {
      setErrorMessage("Select at least one item to export.");
      return;
    }

    const payload = selected.map((item) => item.original);
    const content = JSON.stringify(payload, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `json-image-cleaner-${formatDateForFileName()}.json`;
    anchor.click();

    URL.revokeObjectURL(objectUrl);
    setNoticeMessage(`Downloaded ${selected.length} selected items.`);
    setErrorMessage(null);
  }, [items, selectedIds]);

  const onCopySelected = useCallback(async () => {
    const selected = items.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) {
      setErrorMessage("Select at least one item before copying.");
      return;
    }

    try {
      const payload = JSON.stringify(
        selected.map((item) => item.original),
        null,
        2,
      );
      await navigator.clipboard.writeText(payload);
      setNoticeMessage(`Copied ${selected.length} selected items to clipboard.`);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Copy failed. Browser clipboard access is not available.");
    }
  }, [items, selectedIds]);

  const onCopySingleItem = useCallback(async (item: ParsedItem) => {
    try {
      await navigator.clipboard.writeText(item.jsonString);
      setNoticeMessage("Copied JSON object to clipboard.");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Copy failed. Browser clipboard access is not available.");
    }
  }, []);

  const onReScan = useCallback(() => {
    runValidationForItems(items, true);
    setNoticeMessage("Re-scanning image URLs...");
    setErrorMessage(null);
  }, [items, runValidationForItems]);

  const galleryTotal = galleryModalItem?.imageCandidates.length ?? 0;
  const galleryCurrentUrl =
    galleryModalItem && galleryTotal > 0
      ? galleryModalItem.imageCandidates[galleryCurrentIndex]
      : null;

  const galleryCurrentStatus = galleryCurrentUrl
    ? urlStatuses[galleryCurrentUrl] ?? "loading"
    : null;

  const updateGalleryIndex = useCallback((delta: number) => {
    setGalleryModalState((prev) => {
      if (!prev) {
        return prev;
      }

      const item = items.find((candidate) => candidate.id === prev.itemId);
      if (!item || item.imageCandidates.length === 0) {
        return prev;
      }

      const count = item.imageCandidates.length;
      const nextIndex = (prev.index + delta + count) % count;
      return {
        ...prev,
        index: nextIndex,
      };
    });
  }, [items]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1>JSON Image Cleaner</h1>
        <p>
          Upload JSON, auto-detect image URLs, validate image health in-browser,
          then export only selected records.
        </p>
      </header>

      <section
        className={`${styles.uploadPanel} ${isDragging ? styles.uploadPanelActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".json,application/json"
          onChange={onFileInputChange}
        />

        <h2>Upload JSON</h2>
        <p>Drag and drop a file here or pick a local .json file.</p>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose JSON file
        </button>

        {sourceFileName ? (
          <p className={styles.sourceMeta}>
            Current source: <strong>{sourceFileName}</strong>
            {sourcePath ? ` at ${sourcePath}` : ""}
          </p>
        ) : null}
      </section>

      {pendingPathSelection ? (
        <section className={styles.pathPanel}>
          <h3>Select Array Path</h3>
          <p>
            Multiple arrays were found. Choose the path that contains the items
            you want to render.
          </p>

          <div className={styles.pathInputRow}>
            <input
              value={pathInput}
              onChange={(event) => setPathInput(event.target.value)}
              placeholder={pendingPathSelection.suggestedPath ?? "$.items"}
              aria-label="JSON array path"
            />
            <button type="button" className={styles.primaryButton} onClick={applyPathSelection}>
              Use path
            </button>
          </div>

          <div className={styles.pathSuggestionWrap}>
            {pendingPathSelection.candidates.slice(0, 8).map((candidate) => (
              <button
                type="button"
                key={candidate.path}
                className={styles.pathSuggestion}
                onClick={() => setPathInput(candidate.path)}
              >
                {candidate.path} ({candidate.size})
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      {noticeMessage ? <p className={styles.notice}>{noticeMessage}</p> : null}

      {items.length > 0 ? (
        <>
          <section className={styles.topControls}>
            <div className={styles.tabsBar}>
              {TAB_CONFIG.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className={styles.countBadge}>{tabCounts[tab.key]}</span>
                </button>
              ))}
            </div>

            <div className={styles.metricsGrid}>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("all")}
              >
                <span>Total items</span>
                <strong>{metrics.totalItems}</strong>
              </button>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("no_images")}
              >
                <span>No images</span>
                <strong>{metrics.noImages}</strong>
              </button>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("any_valid")}
              >
                <span>Any valid</span>
                <strong>{metrics.withAnyValid}</strong>
              </button>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("all_valid")}
              >
                <span>All valid</span>
                <strong>{metrics.allValid}</strong>
              </button>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("some_broken")}
              >
                <span>Any broken</span>
                <strong>{metrics.withAnyBroken}</strong>
              </button>
              <button
                type="button"
                className={styles.metricTile}
                onClick={() => setActiveTab("selected")}
              >
                <span>Selected</span>
                <strong>{metrics.selected}</strong>
              </button>
            </div>

            <div className={styles.progressPanel}>
              <span>
                {validationProgress.total > 0
                  ? `${validationProgress.validated} / ${validationProgress.total} images validated`
                  : "No image URLs detected"}
              </span>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    width:
                      validationProgress.total > 0
                        ? `${
                            (validationProgress.validated / validationProgress.total) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </section>

          <section className={styles.cardsGrid}>
            {visibleItems.length === 0 ? (
              <div className={styles.emptyState}>No items in this tab.</div>
            ) : null}

            {visibleItems.map((item) => {
              const summary = itemSummaryMap.get(item.id);
              if (!summary) {
                return null;
              }

              const expanded = expandedPreviewIds.has(item.id);
              const previewUrls = item.imageCandidates.slice(0, 4);
              const extraCount = Math.max(0, item.imageCandidates.length - 4);

              return (
                <article key={item.id} className={styles.card}>
                  <header className={styles.cardHeader}>
                    <div>
                      <h3 title={item.title}>{item.title}</h3>
                      <p>#{item.index + 1}</p>
                    </div>

                    <div className={styles.cardHeaderActions}>
                      <span
                        className={`${styles.statusPill} ${styles[`status_${summary.status}`]}`}
                      >
                        {STATUS_LABELS[summary.status]}
                      </span>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(event) =>
                            toggleItemSelection(item.id, event.target.checked)
                          }
                        />
                        Select
                      </label>
                    </div>
                  </header>

                  <div className={styles.thumbnailRow}>
                    {summary.totalImages === 0 ? (
                      <div className={styles.noImagePanel}>No image candidates</div>
                    ) : (
                      previewUrls.map((url, index) => {
                        const imageStatus = urlStatuses[url] ?? "loading";

                        return (
                          <button
                            type="button"
                            key={`${item.id}-${url}`}
                            className={styles.thumbnailButton}
                          onClick={() =>
                              setGalleryModalState({ itemId: item.id, index })
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Preview ${index + 1}`} loading="lazy" />
                            <span
                              className={`${styles.imageStatusBadge} ${styles[`image_${imageStatus}`]}`}
                            >
                              {IMAGE_STATUS_LABELS[imageStatus]}
                            </span>
                          </button>
                        );
                      })
                    )}

                    {extraCount > 0 ? (
                      <button
                        type="button"
                        className={styles.extraButton}
                        onClick={() =>
                          setGalleryModalState({ itemId: item.id, index: 0 })
                        }
                      >
                        +{extraCount}
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.cardProgress}>
                    <div
                      className={styles.cardProgressFill}
                      style={{ width: `${summary.progress * 100}%` }}
                    />
                  </div>

                  <div
                    className={`${styles.jsonPreview} ${expanded ? styles.jsonPreviewExpanded : ""}`}
                  >
                    <pre>{item.jsonString}</pre>
                  </div>

                  <footer className={styles.cardFooter}>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => {
                        setExpandedPreviewIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) {
                            next.delete(item.id);
                          } else {
                            next.add(item.id);
                          }
                          return next;
                        });
                      }}
                    >
                      {expanded ? "Show less" : "Show more"}
                    </button>

                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => setFullJsonModalItemId(item.id)}
                    >
                      View Full JSON
                    </button>
                  </footer>
                </article>
              );
            })}
          </section>

          <section className={styles.actionBar}>
            <div className={styles.actionGroup}>
              <button type="button" onClick={onSelectCurrentTab}>
                Select all on current tab
              </button>
              <button type="button" onClick={onSelectAnyValid}>
                Select all with any valid image
              </button>
              <button type="button" onClick={onSelectOnlyValid}>
                Select all with only valid images
              </button>
              <button type="button" onClick={onInvertSelection}>
                Invert selection
              </button>
              <button type="button" onClick={onDeselectAll}>
                Deselect all
              </button>
            </div>

            <div className={styles.actionGroup}>
              <button type="button" onClick={onReScan}>
                Re-scan images
              </button>
              <button type="button" onClick={onCopySelected}>
                Copy selected
              </button>
              <button type="button" className={styles.primaryButton} onClick={onDownloadSelected}>
                Create & Download JSON
              </button>
            </div>
          </section>
        </>
      ) : null}

      {fullJsonModalItem ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCardLarge}>
            <header className={styles.modalHeader}>
              <h3>{fullJsonModalItem.title}</h3>
              <div>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => onCopySingleItem(fullJsonModalItem)}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setFullJsonModalItemId(null)}
                >
                  Close
                </button>
              </div>
            </header>
            <pre className={styles.modalJson}>{fullJsonModalItem.jsonString}</pre>
          </div>
        </div>
      ) : null}

      {galleryModalItem && galleryCurrentUrl && galleryCurrentStatus ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <header className={styles.modalHeader}>
              <h3>
                {galleryModalItem.title} ({galleryCurrentIndex + 1}/{galleryTotal})
              </h3>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => setGalleryModalState(null)}
              >
                Close
              </button>
            </header>

            <div className={styles.galleryViewport}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={galleryCurrentUrl} alt="Selected preview" />
            </div>

            <footer className={styles.galleryFooter}>
              <span
                className={`${styles.imageStatusBadge} ${styles[`image_${galleryCurrentStatus}`]}`}
              >
                {IMAGE_STATUS_LABELS[galleryCurrentStatus]}
              </span>
              <div>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => updateGalleryIndex(-1)}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => updateGalleryIndex(1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
