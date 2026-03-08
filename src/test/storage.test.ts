import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStoredAnalyses, saveAnalysis, getAnalysisById, deleteAnalysis } from "@/lib/storage";
import type { StoredAnalysis } from "@/lib/types";

function makeAnalysis(overrides: Partial<StoredAnalysis> = {}): StoredAnalysis {
  return {
    id: overrides.id ?? "test-id-1",
    document: {
      title: "Test Document",
      type: "whitepaper",
      protocol: "Uniswap",
      chain: "Ethereum",
      tags: ["defi"],
      ...overrides.document,
    },
    analysis: {
      model_name: "test-model",
      effectiveness: ["Effective point 1"],
      devil_advocate: ["Devil point 1"],
      best_points: ["Best point 1"],
      could_do_better: ["Better point 1"],
      power_snapshot: ["Power point 1"],
      created_at: "2024-01-01T00:00:00.000Z",
      ...overrides.analysis,
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getStoredAnalyses", () => {
    it("returns empty array when localStorage is empty", () => {
      expect(getStoredAnalyses()).toEqual([]);
    });

    it("returns empty array when localStorage has invalid JSON", () => {
      localStorage.setItem("crypto-xray-analyses", "not json");
      expect(getStoredAnalyses()).toEqual([]);
    });

    it("returns empty array when data is not an array", () => {
      localStorage.setItem("crypto-xray-analyses", '{"not": "array"}');
      expect(getStoredAnalyses()).toEqual([]);
    });

    it("filters out invalid entries", () => {
      const valid = makeAnalysis();
      const invalid = { id: "bad", document: null, analysis: null };
      localStorage.setItem("crypto-xray-analyses", JSON.stringify([valid, invalid]));
      const result = getStoredAnalyses();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("test-id-1");
    });

    it("filters out entries with missing analysis keys", () => {
      const broken = {
        id: "broken",
        document: { title: "Test", type: "other", protocol: "", chain: "", tags: [] },
        analysis: {
          model_name: "m",
          effectiveness: ["a"],
          // missing other keys
          created_at: "2024-01-01",
        },
      };
      localStorage.setItem("crypto-xray-analyses", JSON.stringify([broken]));
      expect(getStoredAnalyses()).toHaveLength(0);
    });
  });

  describe("saveAnalysis", () => {
    it("saves and retrieves an analysis", () => {
      const analysis = makeAnalysis();
      saveAnalysis(analysis);
      const stored = getStoredAnalyses();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("test-id-1");
    });

    it("prepends new analyses (newest first)", () => {
      saveAnalysis(makeAnalysis({ id: "first" }));
      saveAnalysis(makeAnalysis({ id: "second" }));
      const stored = getStoredAnalyses();
      expect(stored[0].id).toBe("second");
      expect(stored[1].id).toBe("first");
    });

    it("caps storage at 200 items", () => {
      for (let i = 0; i < 210; i++) {
        saveAnalysis(makeAnalysis({ id: `item-${i}` }));
      }
      const stored = getStoredAnalyses();
      expect(stored.length).toBeLessThanOrEqual(200);
    });

    it("handles localStorage quota errors gracefully", () => {
      // Fill with some data first
      saveAnalysis(makeAnalysis({ id: "existing" }));

      // Mock localStorage.setItem to throw on first call, succeed on second
      const originalSetItem = localStorage.setItem.bind(localStorage);
      let callCount = 0;
      vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
        callCount++;
        if (callCount === 1) {
          throw new DOMException("QuotaExceededError");
        }
        return originalSetItem(key, value);
      });

      // Should not throw
      expect(() => saveAnalysis(makeAnalysis({ id: "new" }))).not.toThrow();
    });
  });

  describe("getAnalysisById", () => {
    it("returns the correct analysis", () => {
      saveAnalysis(makeAnalysis({ id: "target" }));
      saveAnalysis(makeAnalysis({ id: "other" }));
      const result = getAnalysisById("target");
      expect(result?.id).toBe("target");
    });

    it("returns undefined for non-existent id", () => {
      saveAnalysis(makeAnalysis({ id: "exists" }));
      expect(getAnalysisById("nope")).toBeUndefined();
    });
  });

  describe("deleteAnalysis", () => {
    it("removes the specified analysis", () => {
      saveAnalysis(makeAnalysis({ id: "keep" }));
      saveAnalysis(makeAnalysis({ id: "delete-me" }));
      deleteAnalysis("delete-me");
      const stored = getStoredAnalyses();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("keep");
    });

    it("does nothing for non-existent id", () => {
      saveAnalysis(makeAnalysis({ id: "exists" }));
      deleteAnalysis("nope");
      expect(getStoredAnalyses()).toHaveLength(1);
    });
  });
});
