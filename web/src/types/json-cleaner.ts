export type ItemCardStatus =
  | "all_valid"
  | "any_valid"
  | "all_broken"
  | "some_broken"
  | "no_images";

export type FilterTab =
  | "all"
  | "all_valid"
  | "any_valid"
  | "some_broken"
  | "all_broken"
  | "no_images"
  | "selected";

export interface ParsedItem {
  id: string;
  index: number;
  title: string;
  original: unknown;
  imageCandidates: string[];
  jsonString: string;
}

export interface ItemValidationSummary {
  totalImages: number;
  validCount: number;
  brokenCount: number;
  timeoutCount: number;
  loadingCount: number;
  status: ItemCardStatus;
  progress: number;
}

export interface Metrics {
  totalItems: number;
  noImages: number;
  withAnyValid: number;
  allValid: number;
  withAnyBroken: number;
  selected: number;
}
