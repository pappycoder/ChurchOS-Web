import type jsPDF from "jspdf";

/** Print colors stay consistent regardless of the app's active theme. */
export const PDF_COLORS = {
  navy: "#14243C",
  blue: "#2563EB",
  ink: "#243449",
  muted: "#64748B",
  line: "#E2E8F0",
  soft: "#F4F7FC",
  white: "#FFFFFF",
  green: "#047857",
  red: "#B91C1C",
  amber: "#B45309",
};

export const PDF_FONT = "ChurchOSSans";
export interface PdfMetadata { label: string; value: string }
interface PdfAssets { regular: string; bold: string; logo: string }
let assetsPromise: Promise<PdfAssets> | undefined;

async function base64Asset(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("Unable to load PDF design assets. Please try again.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

export async function preparePdf(doc: jsPDF): Promise<PdfAssets> {
  assetsPromise ??= Promise.all([
    base64Asset("/fonts/pdf/DejaVuSans.ttf"),
    base64Asset("/fonts/pdf/DejaVuSans-Bold.ttf"),
    base64Asset("/brand/churchos-lockup-light.png"),
  ]).then(([regular, bold, logo]) => ({ regular, bold, logo })).catch((error) => {
    assetsPromise = undefined;
    throw error;
  });
  const assets = await assetsPromise;
  doc.addFileToVFS("ChurchOSSans.ttf", assets.regular);
  doc.addFont("ChurchOSSans.ttf", PDF_FONT, "normal");
  doc.addFileToVFS("ChurchOSSans-Bold.ttf", assets.bold);
  doc.addFont("ChurchOSSans-Bold.ttf", PDF_FONT, "bold");
  doc.setFont(PDF_FONT, "normal");
  return assets;
}

export function pdfText(doc: jsPDF, text: string, x: number, y: number, width: number, size = 10, bold = false, color = PDF_COLORS.ink): number {
  doc.setFont(PDF_FONT, bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color);
  const lines: string[] = doc.splitTextToSize(text, width);
  doc.text(lines, x, y, { lineHeightFactor: 1.4 });
  return Math.max(1, lines.length) * size * 0.3528 * 1.4;
}

export function pdfLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(7);
  doc.setTextColor(PDF_COLORS.muted);
  doc.text(text.toUpperCase(), x, y);
}

export function drawPdfHeader(doc: jsPDF, logo: string, label = "REPORT") {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(PDF_COLORS.navy);
  doc.rect(0, 0, width, 25, "F");
  doc.setFillColor(PDF_COLORS.blue);
  doc.rect(0, 25, width, 1.2, "F");
  doc.addImage(logo, "PNG", 14, 1, 42, 23);
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.white);
  doc.text(label.toUpperCase(), width - 14, 14, { align: "right" });
}

export function drawPdfFooters(doc: jsPDF, generatedAt: Date, label = "ChurchOS") {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(PDF_COLORS.line);
    doc.setLineWidth(0.25);
    doc.line(14, height - 16, width - 14, height - 16);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(7);
    doc.setTextColor(PDF_COLORS.muted);
    doc.text(`${label}  ·  ${generatedAt.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}`, 14, height - 10);
    doc.text(`${i} / ${total}`, width - 14, height - 10, { align: "right" });
  }
}
