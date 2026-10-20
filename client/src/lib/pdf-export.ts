import html2pdf from "html2pdf.js";

/**
 * Renders a static, print-ready DOM element to an A4 PDF.
 *
 * The element is expected to be the dedicated quote document (not the editable
 * form), already styled with the `.force-light` paper scope.
 */
export async function exportToPDF(elementId: string, filename = "freelance-quote") {
  const root = document.getElementById(elementId);
  if (!root) {
    throw new Error("No se encontró el elemento para exportar a PDF");
  }

  // html2pdf clones the source node into a fresh container. A `position: fixed`
  // node stays out of the flow there, so capturing the hidden root directly
  // yields a blank page; capture the static document it contains instead.
  const element =
    root.tagName === "ARTICLE"
      ? root
      : root.querySelector<HTMLElement>("article") ?? root;

  const options = {
    // The document supplies its own page padding (p-12), so the PDF margin is
    // zero: html2pdf then sizes the clone to the full A4 width instead of
    // clipping a fixed-width document at a narrower container.
    margin: 0,
    filename: `${filename}.pdf`,
    // PNG keeps text sharper but embeds as uncompressed data (an 8 MB file for
    // a single page). JPEG at 0.95 on a flat paper background is visually
    // indistinguishable and keeps the PDF shareable by email.
    image: { type: "jpeg", quality: 0.95 },
    pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".avoid-break"] },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 794,
      letterRendering: true,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    // Plus Jakarta Sans must be loaded before capture; otherwise html2canvas
    // falls back to a different font and every text metric shifts.
    await document.fonts.ready;
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error("No se pudo exportar el PDF");
  }
}
