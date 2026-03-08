import { StoredAnalysis, LENSES } from "./types";

function analysisToMarkdown(stored: StoredAnalysis): string {
  const { document: doc, analysis } = stored;
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  lines.push("");
  lines.push(`**Type:** ${doc.type.replace("_", " ")}`);
  if (doc.protocol) lines.push(`**Protocol:** ${doc.protocol}`);
  if (doc.chain) lines.push(`**Chain:** ${doc.chain}`);
  if (doc.geography) lines.push(`**Geography:** ${doc.geography}`);
  if (doc.url) lines.push(`**Source:** ${doc.url}`);
  if (doc.tags?.length) lines.push(`**Tags:** ${doc.tags.join(", ")}`);
  lines.push(`**Model:** ${analysis.model_name}`);
  lines.push(`**Analyzed:** ${new Date(analysis.created_at).toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const lens of LENSES) {
    const bullets = analysis[lens.key] as string[];
    lines.push(`## ${lens.title}`);
    lines.push("");
    for (const b of bullets) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsMarkdown(stored: StoredAnalysis) {
  const md = analysisToMarkdown(stored);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const slug = stored.document.title.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  downloadBlob(blob, `${slug}-xray.md`);
}

export async function exportAsPdf(stored: StoredAnalysis) {
  const { jsPDF } = await import("jspdf");
  const { document: doc, analysis } = stored;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > pdf.internal.pageSize.getHeight() - 15) {
      pdf.addPage();
      y = 20;
    }
  };

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(doc.title, maxWidth);
  checkPage(titleLines.length * 8);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // Meta
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120);
  const meta: string[] = [];
  meta.push(`Type: ${doc.type.replace("_", " ")}`);
  if (doc.protocol) meta.push(`Protocol: ${doc.protocol}`);
  if (doc.chain) meta.push(`Chain: ${doc.chain}`);
  meta.push(`Model: ${analysis.model_name}`);
  meta.push(`Analyzed: ${new Date(analysis.created_at).toLocaleString()}`);
  if (doc.url) meta.push(`Source: ${doc.url}`);
  for (const m of meta) {
    checkPage(5);
    pdf.text(m, margin, y);
    y += 4.5;
  }
  y += 4;
  pdf.setTextColor(0);

  // Divider
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Lenses
  for (const lens of LENSES) {
    const bullets = analysis[lens.key] as string[];

    checkPage(14);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.text(lens.title, margin, y);
    y += 7;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    for (const bullet of bullets) {
      const wrapped = pdf.splitTextToSize(`•  ${bullet}`, maxWidth - 4);
      checkPage(wrapped.length * 5 + 2);
      pdf.text(wrapped, margin + 2, y);
      y += wrapped.length * 5 + 1.5;
    }
    y += 5;
  }

  const slug = doc.title.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  pdf.save(`${slug}-xray.pdf`);
}
