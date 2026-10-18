export interface ExportBranding {
  churchName: string;
  logoUrl?: string;
}

export interface ExportLogo { dataUrl: string; width: number; height: number }

/** Browser-only, bounded conversion. A broken optional logo must never block an export. */
export async function loadExportLogo(branding?: ExportBranding): Promise<ExportLogo | undefined> {
  if (!branding?.logoUrl || typeof window === "undefined") return;
  try {
    const url = new URL(branding.logoUrl, window.location.origin);
    if (url.protocol !== "https:" && url.origin !== window.location.origin) return;
    const response = await fetch(url.href, { credentials: "omit", signal: AbortSignal.timeout(5000) });
    if (!response.ok || Number(response.headers.get("content-length")) > 2_000_000) return;
    const type = response.headers.get("content-type")?.split(";")[0] || "";
    if (!/^image\/(png|jpe?g|webp)$/i.test(type) || !response.body) return;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) { await reader.cancel(); return; }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const blob = new Blob([bytes.buffer], { type });
    const bitmap = await createImageBitmap(blob);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width > 8192 || bitmap.height > 8192) return;
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#fcfcf9";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
    } finally { bitmap.close(); }
  } catch { return; }
}
