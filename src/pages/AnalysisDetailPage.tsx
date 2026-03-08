import { useParams, Link, useNavigate } from "react-router-dom";
import { getAnalysisById } from "@/lib/storage";
import { exportAsMarkdown, exportAsPdf } from "@/lib/export";
import { AppHeader } from "@/components/AppHeader";
import { LensCard } from "@/components/LensCard";
import { LENSES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Download, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stored = id ? getAnalysisById(id) : undefined;

  if (!stored) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground font-mono">Analysis not found.</p>
          <Link to="/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">
            ← Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const { document: doc, analysis } = stored;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-4xl py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold mb-3">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs">{doc.type.replace("_", " ")}</Badge>
            {doc.protocol && <Badge variant="secondary" className="font-mono text-xs">{doc.protocol}</Badge>}
            {doc.chain && <Badge variant="secondary" className="font-mono text-xs">{doc.chain}</Badge>}
            {doc.geography && <Badge variant="secondary" className="font-mono text-xs">{doc.geography}</Badge>}
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                <ExternalLink className="w-3 h-3" /> Source
              </a>
            )}
          </div>
          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {doc.tags.map((tag) => (
                <span key={tag} className="text-xs font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Model: {analysis.model_name} · Analyzed: {new Date(analysis.created_at).toLocaleString()}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-1.5"
              onClick={() => {
                exportAsMarkdown(stored);
                toast.success("Markdown exported");
              }}
            >
              <FileText className="w-3.5 h-3.5" /> Export .md
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-1.5"
              onClick={async () => {
                await exportAsPdf(stored);
                toast.success("PDF exported");
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export .pdf
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-1.5"
              onClick={() => {
                navigate("/", {
                  state: {
                    prefill: {
                      title: doc.title,
                      url: doc.url || undefined,
                    },
                  },
                });
                toast.info(doc.url ? "URL pre-filled for re-analysis" : "Submit the document text again to re-analyze");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-analyze
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {LENSES.map((lens) => (
            <LensCard key={lens.key} lensKey={lens.key} bullets={analysis[lens.key] as string[]} />
          ))}
        </div>
      </main>
    </div>
  );
}
