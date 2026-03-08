import { LENSES } from "@/lib/types";
import { Crosshair, ShieldAlert, CheckCircle2, Wrench, Zap } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Crosshair, ShieldAlert, CheckCircle2, Wrench, Zap,
};

export function LensesCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
        5 Analytical Lenses
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {LENSES.map((lens) => {
          const Icon = iconMap[lens.icon];
          return (
            <div key={lens.key} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-md bg-secondary/50">
              {Icon && <Icon className="w-5 h-5 text-primary" />}
              <span className="text-xs font-mono font-medium leading-tight">{lens.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
