import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppHeader } from "@/components/AppHeader";
import { DOCUMENT_TYPES, CHAINS, DocumentType, StoredAnalysis } from "@/lib/types";
import { saveAnalysis } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "" as DocumentType | "",
    protocol: "",
    chain: "",
    url: "",
    tags: "",
    geography: "",
    raw_text: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.type || !form.raw_text) {
      toast.error("Title, type, and document text are required");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("xray-analyze", {
        body: {
          title: form.title,
          type: form.type,
          protocol: form.protocol || undefined,
          chain: form.chain || undefined,
          url: form.url || undefined,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          geography: form.geography || undefined,
          raw_text: form.raw_text,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const stored: StoredAnalysis = {
        id: crypto.randomUUID(),
        document: data.document,
        analysis: data.analysis,
      };

      saveAnalysis(stored);
      toast.success("Analysis complete");
      navigate(`/analysis/${stored.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold text-gradient-cyan mb-2">Analyze Document</h1>
          <p className="text-sm text-muted-foreground">
            Paste any crypto document for a ruthless, structured breakdown across five analytical lenses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Uniswap v4 Governance Proposal"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="font-mono text-xs uppercase tracking-wider">Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DocumentType })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol" className="font-mono text-xs uppercase tracking-wider">Protocol</Label>
              <Input
                id="protocol"
                placeholder="e.g. Uniswap, Aave, Arbitrum"
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain" className="font-mono text-xs uppercase tracking-wider">Chain</Label>
              <Select value={form.chain} onValueChange={(v) => setForm({ ...form, chain: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="font-mono text-xs uppercase tracking-wider">URL (optional)</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geography" className="font-mono text-xs uppercase tracking-wider">Geography</Label>
              <Input
                id="geography"
                placeholder="e.g. Africa, Global"
                value={form.geography}
                onChange={(e) => setForm({ ...form, geography: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="font-mono text-xs uppercase tracking-wider">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. L2, identity, payments"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw_text" className="font-mono text-xs uppercase tracking-wider">Document Text *</Label>
            <Textarea
              id="raw_text"
              placeholder="Paste the full document text here..."
              value={form.raw_text}
              onChange={(e) => setForm({ ...form, raw_text: e.target.value })}
              className="bg-secondary border-border min-h-[250px] font-mono text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-mono text-sm uppercase tracking-widest glow-cyan"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "⚡ Analyze"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
