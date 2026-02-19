export interface StringPathValue {
  value: string;
  path: string;
}

export interface ArrayPathCandidate {
  path: string;
  size: number;
}

export interface NormalizedArrayResult {
  array: unknown[] | null;
  path: string | null;
  error: string | null;
  requiresPathSelection: boolean;
  pathCandidates: ArrayPathCandidate[];
  suggestedPath: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pathDepth(path: string): number {
  if (path === "$") {
    return 0;
  }

  return path
    .replace(/^\$\.?/, "")
    .split(".")
    .filter(Boolean).length;
}

export function findAllStrings(input: unknown, path = "$", seen?: WeakSet<object>): StringPathValue[] {
  const strings: StringPathValue[] = [];
  const visited = seen ?? new WeakSet<object>();

  const visit = (value: unknown, currentPath: string) => {
    if (typeof value === "string") {
      strings.push({ value, path: currentPath });
      return;
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        visit(value[index], `${currentPath}[${index}]`);
      }
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    for (const [key, child] of Object.entries(value)) {
      const nextPath = currentPath === "$" ? `$.${key}` : `${currentPath}.${key}`;
      visit(child, nextPath);
    }
  };

  visit(input, path);
  return strings;
}

export function findArrayPaths(root: unknown): ArrayPathCandidate[] {
  const paths: ArrayPathCandidate[] = [];
  const visited = new WeakSet<object>();

  const visit = (value: unknown, currentPath: string) => {
    if (Array.isArray(value)) {
      paths.push({ path: currentPath, size: value.length });
      for (let index = 0; index < value.length; index += 1) {
        visit(value[index], `${currentPath}[${index}]`);
      }
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    for (const [key, child] of Object.entries(value)) {
      const nextPath = currentPath === "$" ? `$.${key}` : `${currentPath}.${key}`;
      visit(child, nextPath);
    }
  };

  visit(root, "$");

  return paths;
}

function parsePath(path: string): Array<string | number> {
  const cleanPath = path.replace(/^\$\.?/, "");
  if (!cleanPath) {
    return [];
  }

  const tokens: Array<string | number> = [];
  const regex = /([^[.\]]+)|\[(\d+)\]/g;

  let match = regex.exec(cleanPath);
  while (match) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(Number(match[2]));
    }

    match = regex.exec(cleanPath);
  }

  return tokens;
}

export function getValueAtPath(root: unknown, path: string): unknown {
  if (path === "$" || path.trim() === "") {
    return root;
  }

  const tokens = parsePath(path);
  let cursor: unknown = root;

  for (const token of tokens) {
    if (typeof token === "number") {
      if (!Array.isArray(cursor) || token < 0 || token >= cursor.length) {
        return undefined;
      }
      cursor = cursor[token];
      continue;
    }

    if (!isRecord(cursor) || !(token in cursor)) {
      return undefined;
    }

    cursor = cursor[token];
  }

  return cursor;
}

function rankPathCandidates(candidates: ArrayPathCandidate[]): ArrayPathCandidate[] {
  return [...candidates].sort((a, b) => {
    const depthDiff = pathDepth(a.path) - pathDepth(b.path);
    if (depthDiff !== 0) {
      return depthDiff;
    }

    return b.size - a.size;
  });
}

function getPreferredCandidates(root: unknown): ArrayPathCandidate[] {
  const allCandidates = findArrayPaths(root).filter((candidate) => candidate.path !== "$");

  const topLevelish = allCandidates.filter((candidate) => !candidate.path.includes("["));
  return rankPathCandidates(topLevelish.length > 0 ? topLevelish : allCandidates);
}

export function normalizeArrayRoot(
  root: unknown,
  explicitPath?: string,
): NormalizedArrayResult {
  if (Array.isArray(root)) {
    return {
      array: root,
      path: "$",
      error: null,
      requiresPathSelection: false,
      pathCandidates: [{ path: "$", size: root.length }],
      suggestedPath: "$",
    };
  }

  if (!isRecord(root)) {
    return {
      array: null,
      path: null,
      error: "Root JSON must be an array or an object containing an array.",
      requiresPathSelection: false,
      pathCandidates: [],
      suggestedPath: null,
    };
  }

  const candidates = getPreferredCandidates(root);
  const suggestedPath = candidates[0]?.path ?? null;

  if (explicitPath) {
    const value = getValueAtPath(root, explicitPath);
    if (Array.isArray(value)) {
      return {
        array: value,
        path: explicitPath,
        error: null,
        requiresPathSelection: false,
        pathCandidates: candidates,
        suggestedPath,
      };
    }

    return {
      array: null,
      path: null,
      error: `Path "${explicitPath}" did not resolve to an array.`,
      requiresPathSelection: true,
      pathCandidates: candidates,
      suggestedPath,
    };
  }

  if (candidates.length === 0) {
    return {
      array: null,
      path: null,
      error: "No array node found in JSON object.",
      requiresPathSelection: false,
      pathCandidates: [],
      suggestedPath: null,
    };
  }

  if (candidates.length === 1) {
    const onlyCandidate = candidates[0];
    const value = getValueAtPath(root, onlyCandidate.path);
    if (Array.isArray(value)) {
      return {
        array: value,
        path: onlyCandidate.path,
        error: null,
        requiresPathSelection: false,
        pathCandidates: candidates,
        suggestedPath,
      };
    }
  }

  return {
    array: null,
    path: null,
    error:
      "Multiple array nodes found. Choose the correct path to the items array.",
    requiresPathSelection: true,
    pathCandidates: candidates,
    suggestedPath,
  };
}
