"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";

const SHEET_W = 1123;
const SHEET_H = 794;
/** 3369 by 2382 px on 297 by 210 mm is about 288 DPI. */
const PDF_SCALE = 3;
const PNG_SCALE = 2;

/** Wait for the sheet to finish measuring the learner's name against the real fonts. */
async function waitForSheet(svg: Element) {
  const deadline = Date.now() + 5000;
  while (svg.getAttribute("data-fit") !== "ready" && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Serialise the on-page SVG and paint it into a canvas at `scale`. The SVG carries
 * its own embedded fonts, so the raster is set in the brand typefaces.
 */
async function renderCanvas(scale: number) {
  const svg = document.getElementById("certificate-svg");
  if (!svg) throw new Error("no certificate");
  await waitForSheet(svg);

  const width = SHEET_W * scale;
  const height = SHEET_H * scale;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Explicit pixel size, so the image rasterises as vector at the target size.
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no canvas context");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no png"))), "image/png");
  });
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Download and share.
 *
 * Everything happens on the client. The PDF wraps the 3× raster of the on-page SVG
 * in a single A4-landscape page; the PDF writer is imported only when asked for, so
 * it is not in the page's bundle. Print / save as PDF hands off to the browser and
 * is the one path that produces genuine vector text. The PNG stays for sharing to
 * LinkedIn and WhatsApp.
 */
export function CertificateActions({
  publicId,
  learnerName,
  verifyUrl,
}: {
  publicId: string;
  learnerName: string;
  verifyUrl: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const basename = `Save7-${publicId}-${learnerName.replace(/\s+/g, "-")}`;

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setStatus(null);
    try {
      await work();
      setStatus("Downloaded.");
    } catch {
      setStatus("Download didn't work. Use “Print / save as PDF” instead.");
    } finally {
      setBusy(false);
    }
  }

  const downloadPdf = () =>
    run(async () => {
      const [canvas, { PDFDocument }] = await Promise.all([
        renderCanvas(PDF_SCALE),
        import("pdf-lib"),
      ]);
      const png = new Uint8Array(await (await canvasToPng(canvas)).arrayBuffer());

      const pdf = await PDFDocument.create();
      pdf.setTitle(`Save7 Learn certificate ${publicId}`);
      pdf.setAuthor("Save7");
      // A4 landscape in points: 297 by 210 mm.
      const page = pdf.addPage([841.89, 595.28]);
      const image = await pdf.embedPng(png);
      page.drawImage(image, { x: 0, y: 0, width: 841.89, height: 595.28 });
      const bytes = await pdf.save();
      save(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${basename}.pdf`);
    });

  const downloadPng = () =>
    run(async () => {
      save(await canvasToPng(await renderCanvas(PNG_SCALE)), `${basename}.png`);
    });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setStatus("Verification link copied.");
    } catch {
      setStatus(verifyUrl);
    }
  }

  return (
    <div className="no-print">
      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadPdf} disabled={busy}>
          Download as PDF
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print / save as PDF
        </Button>
        <Button variant="outline" onClick={downloadPng} disabled={busy}>
          Download as image (PNG)
        </Button>
        <Button variant="outline" onClick={copyLink}>
          Copy verification link
        </Button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-sand-600">
        {status}
      </p>
    </div>
  );
}
