import { StoredAnalysis } from "./types";

const STORAGE_KEY = "crypto-xray-analyses";

export function getStoredAnalyses(): StoredAnalysis[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(analysis: StoredAnalysis): void {
  const existing = getStoredAnalyses();
  existing.unshift(analysis);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getAnalysisById(id: string): StoredAnalysis | undefined {
  return getStoredAnalyses().find((a) => a.id === id);
}

export function deleteAnalysis(id: string): void {
  const existing = getStoredAnalyses().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
