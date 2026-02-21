import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker is copied to /public/pdf.worker.min.js (.js = correct MIME type for nginx).
// Blob re-export gives the browser a valid module worker URL without MIME issues.
const workerAbsUrl = `${window.location.origin}/pdf.worker.min.js`;
const workerBlob = new Blob(
  [`import '${workerAbsUrl}';`],
  { type: 'application/javascript' }
);
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

interface PdfCanvasProps {
  dataUrl: string;    // base64 data URL of the PDF
  targetW: number;   // desired canvas width in pixels
  targetH: number;   // desired canvas height in pixels
  page?: number;     // page index (0-based), default 0
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({ dataUrl, targetW, targetH, page = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const render = useCallback(async () => {
    if (!canvasRef.current || !dataUrl) return;
    setError(null);

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
    }

    try {
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pageNum = Math.min(page + 1, pdf.numPages);
      const pdfPage = await pdf.getPage(pageNum);

      // Calculate scale to fit targetW × targetH
      const naturalVP = pdfPage.getViewport({ scale: 1 });
      const scaleX = targetW / naturalVP.width;
      const scaleY = targetH / naturalVP.height;
      const scale = Math.min(scaleX, scaleY); // fit, preserving aspect ratio

      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width  = viewport.width;
      canvas.height = viewport.height;

      const task = pdfPage.render({ canvas, viewport });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err instanceof Error && err.message === 'Rendering cancelled') return;
      console.error('[PdfCanvas] render error', err);
      setError('Błąd renderowania PDF');
    }
  }, [dataUrl, targetW, targetH, page]);

  useEffect(() => {
    void render();
    return () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
      }
    };
  }, [render]);

  if (error) return <div className="pdf-render-error">{error}</div>;

  return (
    <canvas
      ref={canvasRef}
      className="pdf-canvas"
      style={{
        display: 'block',
        width: targetW,
        height: targetH,
        objectFit: 'contain',
      }}
    />
  );
};
