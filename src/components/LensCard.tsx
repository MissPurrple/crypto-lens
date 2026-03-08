import { cn } from "@/lib/utils";
import { Analysis, LENSES } from "@/lib/types";

interface LensCardProps {
  lensKey: keyof Pick<Analysis, "effectiveness" | "devil_advocate" | "best_points" | "could_do_better" | "power_snapshot">;
  bullets: string[];
}

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

export function LensCard({ lensKey, bullets }: LensCardProps) {
  const lens = LENSES.find((l) => l.key === lensKey);
  if (!lens) return null;

  return (
    <div className={cn("rounded-lg border p-5", colorMap[lensKey])}>
      <h3 className="font-mono text-sm font-semibold mb-3 flex items-center gap-2">
        <span>{lens.icon}</span>
        <span className="uppercase tracking-wider">{lens.title}</span>
      </h3>
      <ul className="space-y-2">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
            <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", dotColorMap[lensKey])} />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}
