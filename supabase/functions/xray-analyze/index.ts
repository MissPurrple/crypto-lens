import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a ruthless but fair crypto document analyst. You analyze governance proposals, whitepapers, RFPs, tokenomics docs, blog posts, and other crypto-related documents.

Your output MUST be strict JSON with exactly these five keys, each mapping to an array of bullet-point strings (no nested objects, no markdown, just plain text strings):

{
  "effectiveness": ["bullet 1", "bullet 2", ...],
  "devil_advocate": ["bullet 1", "bullet 2", ...],
  "best_points": ["bullet 1", "bullet 2", ...],
  "could_do_better": ["bullet 1", "bullet 2", ...],
  "power_snapshot": ["bullet 1", "bullet 2", ...]
}

Lens definitions:
- effectiveness: How well the design is likely to achieve its stated goals in the real world.
- devil_advocate: The strongest steel-manned critique: failure modes, attack surfaces, bad assumptions, risks.
- best_points: Where the design is genuinely strong, novel, or correctly conservative.
- could_do_better: Specific, actionable improvements: clarify assumptions, fix incentives, address missing stakeholders.
- power_snapshot: Who wins, who loses, who pays, and how this changes power dynamics between actors.

Rules:
- Be critical but honest. No hype. No sugarcoating. No unnecessary disclaimers.
- Each array should have 3-8 bullet points.
- Each bullet should be 1-3 sentences, specific and actionable.
- Output ONLY the JSON object. No surrounding text, no code fences.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { title, type, protocol, chain, url, tags, geography, raw_text } = body;

    if (!raw_text || !title || !type) {
      return new Response(
        JSON.stringify({ error: "title, type, and raw_text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiBaseUrl = Deno.env.get("VENICE_BASE_URL") || "https://api.venice.ai/api/v1";
    const aiModel = Deno.env.get("VENICE_MODEL") || "deepseek-r1-671b";
    const aiApiKey = Deno.env.get("VENICE_API_KEY");

    if (!aiApiKey) {
      return new Response(
        JSON.stringify({ error: "VENICE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Analyze this ${type.replace("_", " ")}${protocol ? ` from ${protocol}` : ""}${chain ? ` on ${chain}` : ""}:

Title: ${title}
${url ? `URL: ${url}` : ""}
${tags?.length ? `Tags: ${tags.join(", ")}` : ""}
${geography ? `Geography: ${geography}` : ""}

--- DOCUMENT TEXT ---
${raw_text}
--- END DOCUMENT TEXT ---`;

    const aiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI API request failed", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse JSON from the response (handle potential markdown fences)
    let analysis;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "AI response was not valid JSON", raw: rawContent }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requiredKeys = ["effectiveness", "devil_advocate", "best_points", "could_do_better", "power_snapshot"];
    for (const key of requiredKeys) {
      if (!Array.isArray(analysis[key])) {
        return new Response(
          JSON.stringify({ error: `Missing or invalid key: ${key}`, raw: rawContent }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const result = {
      document: { title, type, protocol, chain, url, tags, geography },
      analysis: {
        model_name: aiModel,
        effectiveness: analysis.effectiveness,
        devil_advocate: analysis.devil_advocate,
        best_points: analysis.best_points,
        could_do_better: analysis.could_do_better,
        power_snapshot: analysis.power_snapshot,
        raw_response: rawContent,
        created_at: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
