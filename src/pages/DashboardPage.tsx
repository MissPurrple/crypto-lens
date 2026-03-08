import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredAnalyses, deleteAnalysis } from "@/lib/storage";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/types";
import { Trash2, Search, FileText } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState(getStoredAnalyses());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      const matchSearch =
        !search ||
        a.document.title.toLowerCase().includes(search.toLowerCase()) ||
        a.document.protocol?.toLowerCase().includes(search.toLowerCase()) ||
        a.document.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === "all" || a.document.type === filterType;
      return matchSearch && matchType;
    });
  }, [analyses, search, filterType]);

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    setAnalyses(getStoredAnalyses());
    toast.success("Analysis deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold text-gradient-cyan mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your locally stored analyses.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, protocol, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-mono text-sm">
              {analyses.length === 0 ? "No analyses yet. Go analyze a document!" : "No results match your filters."}
            </p>
            {analyses.length === 0 && (
              <Link to="/">
                <Button variant="outline" className="mt-4 font-mono text-xs">⚡ Analyze a Document</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <Link
                key={a.id}
                to={`/analysis/${a.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{a.document.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">{a.document.type.replace("_", " ")}</Badge>
                    {a.document.protocol && <span className="text-xs text-muted-foreground">{a.document.protocol}</span>}
                    {a.document.chain && <span className="text-xs text-muted-foreground">· {a.document.chain}</span>}
                    <span className="text-xs text-muted-foreground">· {new Date(a.analysis.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(a.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
