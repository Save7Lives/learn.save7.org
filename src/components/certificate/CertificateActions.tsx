"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";

/**
 * Download and share.
 *
 * The PNG is produced by serialising the on-page SVG into a canvas — no library, and
 * no server round trip. Printing hands off to the browser's own print-to-PDF, which
 * is both better than anything we would generate and already familiar.
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

  async function downloadPng() {
    setStatus(null);
    const svg = document.getElementById("certificate-svg");
    if (!svg) {
      setStatus("Couldn't find the certificate to download.");
      return;
    }

    try {
      const serialised = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([serialised], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const image = new Image();
      // 2× for a crisp file at print size.
      const scale = 2;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("render failed"));
        image.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1123 * scale;
      canvas.height = 794 * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no canvas context");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = `Save7-${publicId}-${learnerName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setStatus("Downloaded.");
    } catch {
      setStatus("Download didn't work. Use “Print / save as PDF” instead.");
    }
  }

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
        <Button onClick={downloadPng}>Download as image</Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print / save as PDF
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
