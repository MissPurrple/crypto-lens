import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredAnalyses } from "@/lib/storage";
import { AppHeader } from "@/components/AppHeader";
import { LENSES, StoredAnalysis } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Crosshair, ShieldAlert, CheckCircle2, Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Crosshair, ShieldAlert, CheckCircle2, Wrench, Zap,
};

const colorMap: Record<string, string> = {
  effectiveness: "border-primary/30 bg-primary/5",
  devil_advocate: "border-destructive/30 bg-destructive/5",
  best_points: "border-success/30 bg-success/5",
  could_do_better: "border-warning/30 bg-warning/5",
  power_snapshot: "border-accent/30 bg-accent/5",
};

const dotColorMap: Record<string, string> = {
  effectiveness: "bg-primary",
  devil_advocate: "bg-destructive",
  best_points: "bg-success",
  could_do_better: "bg-warning",
  power_snapshot: "bg-accent",
};

export default function ComparePage() {
  const analyses = useMemo(() => getStoredAnalyses(), []);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const left = analyses.find((a) => a.id === leftId);
  const right = analyses.find((a) => a.id === rightId);

  const availableForLeft = analyses.filter((a) => a.id !== rightId);
  const availableForRight = analyses.filter((a) => a.id !== leftId);

  if (analyses.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-5xl py-16 text-center">
          <p className="text-muted-foreground font-mono text-sm">
            You need at least 2 analyses to compare. Go analyze some documents first.
          </p>
          <Link to="/">
            <Button variant="outline" className="mt-4 font-mono text-xs">Analyze a Document</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-7xl py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-mono font-bold text-gradient-primary mb-6">Compare Analyses</h1>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Selector
            label="Left"
            analyses={availableForLeft}
            selectedId={leftId}
            onSelect={setLeftId}
          />
          <Selector
            label="Right"
            analyses={availableForRight}
            selectedId={rightId}
            onSelect={setRightId}
          />
        </div>

        {/* Comparison */}
        {left && right ? (
          <div className="space-y-6">
            {LENSES.map((lens) => {
              const Icon = iconMap[lens.icon];
              const leftBullets = left.analysis[lens.key] as string[];
              const rightBullets = right.analysis[lens.key] as string[];

              return (
                <div key={lens.key} className={cn("rounded-lg border p-5", colorMap[lens.key])}>
                  <h3 className="font-mono text-sm font-semibold mb-4 flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="uppercase tracking-wider">{lens.title}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 truncate">{left.document.title}</p>
                      <ul className="space-y-2">
                        {leftBullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                            <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", dotColorMap[lens.key])} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:border-l md:border-border/50 md:pl-6">
                      <p className="font-mono text-xs text-muted-foreground mb-2 truncate">{right.document.title}</p>
                      <ul className="space-y-2">
                        {rightBullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                            <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", dotColorMap[lens.key])} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground font-mono text-sm">Select two analyses above to compare them side by side.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Selector({
  label,
  analyses,
  selectedId,
  onSelect,
}: {
  label: string;
  analyses: StoredAnalysis[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const selected = analyses.find((a) => a.id === selectedId);

  if (selected) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-card">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-mono mb-0.5">{label}</p>
          <p className="text-sm font-medium truncate">{selected.document.title}</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onSelect(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground font-mono mb-2">{label}</p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className="w-full text-left p-2 rounded-md hover:bg-secondary transition-colors"
          >
            <p className="text-sm truncate">{a.document.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="font-mono text-[10px]">{a.document.type.replace("_", " ")}</Badge>
              <span className="text-[10px] text-muted-foreground">{new Date(a.analysis.created_at).toLocaleDateString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
