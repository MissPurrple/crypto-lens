import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredAnalyses, deleteAnalysis } from "@/lib/storage";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Search, FileText, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState(getStoredAnalyses());
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return analyses;
    const q = search.toLowerCase();
    return analyses.filter((a) =>
      a.document.title?.toLowerCase().includes(q) ||
      a.document.protocol?.toLowerCase().includes(q) ||
      a.document.chain?.toLowerCase().includes(q) ||
      a.document.url?.toLowerCase().includes(q) ||
      a.document.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [analyses, search]);

  const deleteTarget = deleteId ? analyses.find((a) => a.id === deleteId) : null;

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAnalysis(deleteId);
    setAnalyses(getStoredAnalyses());
    setDeleteId(null);
    toast.success("Analysis deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold text-gradient-primary mb-2">Dashboard</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your locally stored analyses.</p>
            {analyses.length >= 2 && (
              <Link to="/compare">
                <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
                  <GitCompareArrows className="w-3.5 h-3.5" /> Compare
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search analyses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
            aria-label="Search analyses"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted-foreground font-mono text-sm">
              {analyses.length === 0 ? "No analyses yet. Go analyze a document!" : "No results match your search."}
            </p>
            {analyses.length === 0 && (
              <Link to="/">
                <Button variant="outline" className="mt-4 font-mono text-xs">Analyze a Document</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Analysis results">
            {filtered.map((a) => (
              <Link
                key={a.id}
                to={`/analysis/${a.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
                role="listitem"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{a.document.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {a.document.type && (
                      <Badge variant="outline" className="font-mono text-[10px]">{a.document.type.replace("_", " ")}</Badge>
                    )}
                    {a.document.chain && (
                      <Badge variant="secondary" className="font-mono text-[10px]">{a.document.chain}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{new Date(a.analysis.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete analysis: ${a.document.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteId(a.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.document.title ?? "this analysis"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
