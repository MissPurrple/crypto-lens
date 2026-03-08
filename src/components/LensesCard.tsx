import { LENSES } from "@/lib/types";

export function LensesCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
        5 Analytical Lenses
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {LENSES.map((lens) => (
          <div key={lens.key} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-md bg-secondary/50">
            <span className="text-xl">{lens.icon}</span>
            <span className="text-xs font-mono font-medium leading-tight">{lens.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
