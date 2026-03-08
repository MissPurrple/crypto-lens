import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppHeader } from "@/components/AppHeader";
import { LensesCard } from "@/components/LensesCard";
import { StoredAnalysis, DocumentType, DOCUMENT_TYPES, CHAINS } from "@/lib/types";
import { saveAnalysis } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Link2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE_LABEL = "5MB";
const MAX_TEXT_LENGTH = 100_000;
const WARN_TEXT_LENGTH = 30_000;

function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("paste");
  const [rawText, setRawText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [metaOpen, setMetaOpen] = useState(false);

  // Document metadata
  const [docType, setDocType] = useState<DocumentType>("other");
  const [protocol, setProtocol] = useState("");
  const [chain, setChain] = useState("");
  const [geography, setGeography] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_LABEL}.`);
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      setTab("paste");
      toast.success(`Loaded "${file.name}"`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  }, []);

  const handleTextChange = (value: string) => {
    if (value.length > MAX_TEXT_LENGTH) {
      toast.error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`);
      return;
    }
    setRawText(value);
  };

  const getInputText = (): { text: string; title: string } | null => {
    if (tab === "paste" && rawText.trim()) {
      const title = rawText.trim().split("\n")[0]?.slice(0, 100) ?? "Untitled";
      return { text: rawText.trim(), title };
    }
    if (tab === "url" && url.trim()) {
      return { text: "", title: url.trim() };
    }
    return null;
  };

  const handleSubmit = async () => {
    if (tab === "url") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        toast.error("Please enter a URL");
        return;
      }
      if (!isValidHttpUrl(trimmedUrl)) {
        toast.error("Please enter a valid HTTP or HTTPS URL");
        return;
      }
    }

    const input = getInputText();
    if (!input) {
      toast.error("Please paste text, upload a document, or enter a URL");
      return;
    }

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const body: Record<string, unknown> = {
        title: input.title,
        type: docType,
        protocol: protocol || undefined,
        chain: chain || undefined,
        geography: geography || undefined,
        tags: tags.length > 0 ? tags : undefined,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      console.error("Analysis error:", err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasInput = (tab === "paste" && rawText.trim()) || (tab === "url" && url.trim());
  const textLength = rawText.length;
  const isOverWarnLimit = textLength > WARN_TEXT_LENGTH;

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
              onChange={(e) => handleTextChange(e.target.value)}
              className="bg-secondary border-border min-h-[250px] font-mono text-sm"
              aria-label="Document text input"
              maxLength={MAX_TEXT_LENGTH}
            />
            {textLength > 0 && (
              <p className={cn(
                "text-xs mt-1.5 font-mono text-right",
                isOverWarnLimit ? "text-warning" : "text-muted-foreground"
              )}>
                {textLength.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} chars
                {isOverWarnLimit && ` (only first ${WARN_TEXT_LENGTH.toLocaleString()} sent to AI)`}
              </p>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <label
              className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-secondary/50 cursor-pointer hover:border-primary/40 transition-colors"
              role="button"
              tabIndex={0}
              aria-label={`Upload a text document, maximum size ${MAX_FILE_SIZE_LABEL}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.click();
                }
              }}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                {fileName || `Click to upload a text document (max ${MAX_FILE_SIZE_LABEL})`}
              </span>
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.xml,.html"
                className="hidden"
                onChange={handleFileUpload}
                aria-hidden="true"
                tabIndex={-1}
              />
            </label>
            {rawText && fileName && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Loaded {rawText.length.toLocaleString()} characters from {fileName}
              </p>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <Input
              placeholder="https://example.com/proposal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              type="url"
              aria-label="Document URL"
            />
            <p className="text-xs text-muted-foreground mt-2">
              We'll fetch and analyze the content at this URL.
            </p>
          </TabsContent>
        </Tabs>

        {/* Document Metadata */}
        <Collapsible open={metaOpen} onOpenChange={setMetaOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between font-mono text-xs text-muted-foreground hover:text-foreground">
              Document Details (optional)
              {metaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="doc-type" className="text-xs font-mono text-muted-foreground mb-1 block">
                  Document Type
                </label>
                <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                  <SelectTrigger id="doc-type" className="bg-secondary border-border font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value} className="font-mono text-xs">
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="chain" className="text-xs font-mono text-muted-foreground mb-1 block">
                  Chain
                </label>
                <Select value={chain} onValueChange={setChain}>
                  <SelectTrigger id="chain" className="bg-secondary border-border font-mono text-xs">
                    <SelectValue placeholder="Select chain..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAINS.map((c) => (
                      <SelectItem key={c} value={c} className="font-mono text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="protocol" className="text-xs font-mono text-muted-foreground mb-1 block">
                  Protocol
                </label>
                <Input
                  id="protocol"
                  placeholder="e.g. Uniswap, Aave..."
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="bg-secondary border-border font-mono text-xs"
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="geography" className="text-xs font-mono text-muted-foreground mb-1 block">
                  Geography
                </label>
                <Input
                  id="geography"
                  placeholder="e.g. Global, US, EU..."
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  className="bg-secondary border-border font-mono text-xs"
                  maxLength={100}
                />
              </div>
            </div>
            <div>
              <label htmlFor="tags" className="text-xs font-mono text-muted-foreground mb-1 block">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                placeholder="e.g. defi, governance, tokenomics"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-secondary border-border font-mono text-xs"
                maxLength={500}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={handleSubmit}
          disabled={loading || !hasInput}
          className="w-full h-12 font-mono text-sm uppercase tracking-widest mt-4 glow-primary"
          aria-label={loading ? "Analyzing document" : "Analyze document"}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </main>
    </div>
  );
}
