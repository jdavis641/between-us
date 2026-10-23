import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a cleanly styled, multi-page PDF document for stories and scenarios.
 */
export function exportStoryToPdf(title: string, content: string, subtitle?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxLineWidth = pageWidth - (margin * 2);

  // Top header band
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 85, 'F');

  // Brand title
  doc.setTextColor(244, 63, 94); // rose-500
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('BETWEEN US', margin, 36);

  // Story Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  const truncatedTitle = title.length > 44 ? title.substring(0, 41) + '...' : title;
  doc.text(truncatedTitle, margin, 62);

  if (subtitle) {
    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitle, pageWidth - margin, 62, { align: 'right' });
  }

  let currentY = 120;
  doc.setTextColor(39, 39, 42); // zinc-800
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const lineHeight = 16;

  const paragraphs = (content || '').split('\n');

  for (const rawPara of paragraphs) {
    const para = rawPara.trim();
    if (!para) {
      currentY += lineHeight * 0.7;
      continue;
    }

    if (para.startsWith('## ') || para.startsWith('# ')) {
      const headingText = para.replace(/^#+\s*/, '');
      currentY += 12;
      if (currentY + 30 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(headingText, margin, currentY);
      currentY += 18;
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(39, 39, 42);
      continue;
    }

    const lines = doc.splitTextToSize(para, maxLineWidth);
    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += lineHeight;
    }
    currentY += 6;
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(
      `Between Us • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: 'center' }
    );
  }

  const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.pdf`;
  doc.save(safeFilename);
}
