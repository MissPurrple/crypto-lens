import { StoredAnalysis } from "./types";

const STORAGE_KEY = "crypto-xray-analyses";
const MAX_STORAGE_ITEMS = 200;

/**
 * Validates that a value matches the StoredAnalysis shape.
 * Returns the value if valid, null otherwise.
 */
function isValidStoredAnalysis(value: unknown): value is StoredAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.document !== "object" || obj.document === null) return false;
  if (typeof obj.analysis !== "object" || obj.analysis === null) return false;

  const doc = obj.document as Record<string, unknown>;
  if (typeof doc.title !== "string") return false;
  if (typeof doc.type !== "string") return false;

  const analysis = obj.analysis as Record<string, unknown>;
  const requiredArrayKeys = [
    "effectiveness",
    "devil_advocate",
    "best_points",
    "could_do_better",
    "power_snapshot",
  ];
  for (const key of requiredArrayKeys) {
    if (!Array.isArray(analysis[key])) return false;
  }
  if (typeof analysis.model_name !== "string") return false;
  if (typeof analysis.created_at !== "string") return false;

  return true;
}

export function getStoredAnalyses(): StoredAnalysis[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Validate each item and filter out corrupt entries
    return parsed.filter(isValidStoredAnalysis);
  } catch {
    return [];
  }
}

export function saveAnalysis(analysis: StoredAnalysis): void {
  const existing = getStoredAnalyses();
  existing.unshift(analysis);
  // Cap storage to prevent localStorage quota exhaustion
  const capped = existing.slice(0, MAX_STORAGE_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error("Failed to save analysis to localStorage:", err);
    // If quota exceeded, try removing oldest entries
    if (existing.length > 10) {
      const smaller = capped.slice(0, Math.floor(capped.length / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(smaller));
    }
  }
}

export function getAnalysisById(id: string): StoredAnalysis | undefined {
  return getStoredAnalyses().find((a) => a.id === id);
}

export function deleteAnalysis(id: string): void {
  const existing = getStoredAnalyses().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
