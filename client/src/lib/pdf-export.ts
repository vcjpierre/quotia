import html2pdf from "html2pdf.js";

export async function exportToPDF(elementId: string, filename = "freelance-quote") {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found for PDF export");
  }

  const options = {
    margin: 0.5,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait' 
    }
  };

  try {
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error("Failed to export PDF");
  }
}

export function generateShareableURL(quoteId?: number): string {
  const baseUrl = window.location.origin;
  if (quoteId) {
    return `${baseUrl}/quote/${quoteId}`;
  }
  return `${baseUrl}/calculator`;
}
