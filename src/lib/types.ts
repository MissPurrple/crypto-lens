export type DocumentType =
  | "governance_proposal"
  | "whitepaper"
  | "litepaper"
  | "tokenomics_note"
  | "rfp"
  | "blog_post"
  | "other";

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "governance_proposal", label: "Governance Proposal" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "litepaper", label: "Litepaper" },
  { value: "tokenomics_note", label: "Tokenomics Note" },
  { value: "rfp", label: "RFP" },
  { value: "blog_post", label: "Blog Post" },
  { value: "other", label: "Other" },
];

export const CHAINS = [
  "Ethereum", "Solana", "Base", "Polygon", "Arbitrum", "Optimism", "Avalanche", "BNB Chain", "Other"
];

export interface DocumentMeta {
  title: string;
  type: DocumentType;
  protocol: string;
  chain: string;
  url?: string;
  tags: string[];
  geography?: string;
}

export interface Analysis {
  model_name: string;
  effectiveness: string[];
  devil_advocate: string[];
  best_points: string[];
  could_do_better: string[];
  power_snapshot: string[];
  raw_response: string;
  created_at: string;
}

export interface StoredAnalysis {
  id: string;
  document: DocumentMeta;
  analysis: Analysis;
}

export interface LensConfig {
  key: keyof Pick<Analysis, "effectiveness" | "devil_advocate" | "best_points" | "could_do_better" | "power_snapshot">;
  title: string;
  icon: string;
  color: string;
}

export const LENSES: LensConfig[] = [
  { key: "effectiveness", title: "Effectiveness", icon: "🎯", color: "primary" },
  { key: "devil_advocate", title: "Devil's Advocate", icon: "😈", color: "destructive" },
  { key: "best_points", title: "Best Points", icon: "✅", color: "success" },
  { key: "could_do_better", title: "Could Do Better", icon: "🔧", color: "warning" },
  { key: "power_snapshot", title: "Power & Incentives", icon: "⚡", color: "accent" },
];
