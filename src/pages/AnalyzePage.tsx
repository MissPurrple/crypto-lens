import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";
import { LensesCard } from "@/components/LensesCard";
import { StoredAnalysis } from "@/lib/types";
import { saveAnalysis } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Link2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("paste");
  const [rawText, setRawText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      setTab("paste");
      toast.success(`Loaded "${file.name}"`);
    };
    reader.readAsText(file);
  }, []);

  const getInputText = (): { text: string; title: string } | null => {
    if (tab === "paste" && rawText.trim()) {
      const title = rawText.trim().split("\n")[0].slice(0, 100);
      return { text: rawText.trim(), title };
    }
    if (tab === "url" && url.trim()) {
      return { text: "", title: url.trim() };
    }
    return null;
  };

  const handleSubmit = async () => {
    const input = getInputText();
    if (!input) {
      toast.error("Please paste text, upload a document, or enter a URL");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: input.title,
        type: "other",
        raw_text: input.text,
      };

      if (tab === "url") {
        body.url = url.trim();
        body.fetch_url = true;
      }

      const { data, error } = await supabase.functions.invoke("xray-analyze", { body });

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

  const hasInput = (tab === "paste" && rawText.trim()) || (tab === "url" && url.trim());

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-mono font-bold text-gradient-primary mb-2">Analyze Document</h1>
          <p className="text-sm text-muted-foreground">
            Paste text, upload a file, or submit a URL for a ruthless, structured breakdown.
          </p>
        </div>

        <LensesCard />

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="paste" className="font-mono text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="font-mono text-xs gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="font-mono text-xs gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Submit URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4">
            <Textarea
              placeholder="Paste the full document text here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="bg-secondary border-border min-h-[250px] font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-secondary/50 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {fileName || "Click to upload a text document (.txt, .md, .csv)"}
              </span>
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.xml,.html"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {rawText && fileName && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                ✓ Loaded {rawText.length.toLocaleString()} characters from {fileName}
              </p>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <Input
              placeholder="https://example.com/proposal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              We'll fetch and analyze the content at this URL.
            </p>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={loading || !hasInput}
          className="w-full h-12 font-mono text-sm uppercase tracking-widest mt-6 glow-primary"
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
      </main>
    </div>
  );
}
