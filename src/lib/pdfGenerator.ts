/**
 * PDF Generator Service
 * Generates RRA 2025 compliant tenancy agreement PDFs
 */

import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { substituteVariables } from './agreementCreatorService';
import type {
  AgreementTemplate,
  AgreementFormData,
} from '../types';

// Page settings
const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const TITLE_SIZE = 18;
const HEADING_SIZE = 14;
const BODY_SIZE = 10;
const FOOTER_SIZE = 8;

interface PdfGeneratorOptions {
  includeSignaturePages: boolean;
  includeWatermark: boolean;
}

/**
 * Generate a tenancy agreement PDF from template and form data
 */
export async function generateAgreementPdf(
  template: AgreementTemplate,
  formData: Partial<AgreementFormData>,
  options: PdfGeneratorOptions = { includeSignaturePages: true, includeWatermark: false }
): Promise<Uint8Array> {
  // Create new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const primaryBlue = rgb(0.2, 0.4, 0.8);

  // Track current position
  let currentPage = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = currentPage.getSize();
  let y = height - PAGE_MARGIN;
  let pageNumber = 1;

  // Helper function to add new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage(PageSizes.A4);
    y = height - PAGE_MARGIN;
    pageNumber++;
    return currentPage;
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (y - neededSpace < PAGE_MARGIN + 30) {
      addNewPage();
    }
  };

  // Helper function to draw text with word wrap
  const drawWrappedText = (
    text: string,
    fontSize: number,
    font: typeof helvetica,
    color = black,
    indent = 0
  ) => {
    const maxWidth = width - PAGE_MARGIN * 2 - indent;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && line) {
        checkPageBreak(LINE_HEIGHT);
        currentPage.drawText(line, {
          x: PAGE_MARGIN + indent,
          y,
          size: fontSize,
          font,
          color,
        });
        y -= LINE_HEIGHT;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      checkPageBreak(LINE_HEIGHT);
      currentPage.drawText(line, {
        x: PAGE_MARGIN + indent,
        y,
        size: fontSize,
        font,
        color,
      });
      y -= LINE_HEIGHT;
    }
  };

  // Draw multi-line text (handles \n)
  const drawMultilineText = (
    text: string,
    fontSize: number,
    font: typeof helvetica,
    color = black,
    indent = 0
  ) => {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        drawWrappedText(line.trim(), fontSize, font, color, indent);
      } else {
        y -= LINE_HEIGHT / 2; // Half line for empty lines
      }
    }
  };

  // ========================
  // TITLE PAGE
  // ========================

  // Document title
  y -= 40;
  currentPage.drawText('ASSURED SHORTHOLD TENANCY AGREEMENT', {
    x: PAGE_MARGIN,
    y,
    size: TITLE_SIZE,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 30;

  // Subtitle
  currentPage.drawText('Renters\' Rights Act 2025 Compliant', {
    x: PAGE_MARGIN,
    y,
    size: 12,
    font: helvetica,
    color: gray,
  });
  y -= 10;

  currentPage.drawText(`Template Version: ${template.version}`, {
    x: PAGE_MARGIN,
    y,
    size: 10,
    font: helvetica,
    color: lightGray,
  });
  y -= 40;

  // Property address box
  currentPage.drawRectangle({
    x: PAGE_MARGIN,
    y: y - 60,
    width: width - PAGE_MARGIN * 2,
    height: 70,
    borderColor: primaryBlue,
    borderWidth: 1,
  });

  y -= 15;
  currentPage.drawText('PROPERTY:', {
    x: PAGE_MARGIN + 10,
    y,
    size: 10,
    font: helveticaBold,
    color: gray,
  });
  y -= 18;
  currentPage.drawText(formData.propertyAddress || '[Property Address]', {
    x: PAGE_MARGIN + 10,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });
  y -= 50;

  // Key details summary
  const summaryItems = [
    { label: 'Landlord:', value: formData.landlordName || '[Landlord Name]' },
    { label: 'Tenant:', value: formData.tenantName || '[Tenant Name]' },
    { label: 'Tenancy Start Date:', value: formData.tenancyStartDate ? formatDate(formData.tenancyStartDate) : '[Start Date]' },
    { label: 'Monthly Rent:', value: formData.rentAmount ? `£${formData.rentAmount.toLocaleString()}` : '[Rent Amount]' },
    { label: 'Deposit:', value: formData.depositAmount ? `£${formData.depositAmount.toLocaleString()}` : '[Deposit Amount]' },
  ];

  for (const item of summaryItems) {
    currentPage.drawText(item.label, {
      x: PAGE_MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: gray,
    });
    currentPage.drawText(item.value, {
      x: PAGE_MARGIN + 130,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    y -= 18;
  }

  // RRA 2025 notice
  y -= 30;
  currentPage.drawRectangle({
    x: PAGE_MARGIN,
    y: y - 50,
    width: width - PAGE_MARGIN * 2,
    height: 60,
    color: rgb(0.95, 0.97, 1),
    borderColor: primaryBlue,
    borderWidth: 0.5,
  });

  y -= 15;
  currentPage.drawText('IMPORTANT: RRA 2025 NOTICE', {
    x: PAGE_MARGIN + 10,
    y,
    size: 9,
    font: helveticaBold,
    color: primaryBlue,
  });
  y -= 14;
  const rraNotice = 'This is a periodic tenancy. The tenant may end it by giving 2 months\' notice. The landlord may only seek possession on specific legal grounds.';
  drawWrappedText(rraNotice, 8, helvetica, gray, 10);

  // ========================
  // AGREEMENT SECTIONS
  // ========================

  addNewPage();

  for (const section of template.sections) {
    // Section heading
    checkPageBreak(40);
    y -= 10;

    currentPage.drawText(section.title.toUpperCase(), {
      x: PAGE_MARGIN,
      y,
      size: HEADING_SIZE,
      font: helveticaBold,
      color: primaryBlue,
    });
    y -= 8;

    // Underline
    currentPage.drawLine({
      start: { x: PAGE_MARGIN, y },
      end: { x: width - PAGE_MARGIN, y },
      thickness: 0.5,
      color: primaryBlue,
    });
    y -= 20;

    // Clauses
    for (const clause of section.clauses) {
      // Skip prohibited clauses
      if (clause.isProhibited) continue;

      checkPageBreak(30);

      // Clause title
      currentPage.drawText(clause.title, {
        x: PAGE_MARGIN,
        y,
        size: BODY_SIZE,
        font: helveticaBold,
        color: black,
      });

      if (clause.isMandatory) {
        const titleWidth = helveticaBold.widthOfTextAtSize(clause.title, BODY_SIZE);
        currentPage.drawText(' [MANDATORY]', {
          x: PAGE_MARGIN + titleWidth + 5,
          y,
          size: 7,
          font: helvetica,
          color: rgb(0.8, 0.2, 0.2),
        });
      }
      y -= 16;

      // Clause content with variable substitution
      const content = substituteVariables(clause.content, formData as Partial<AgreementFormData>);
      drawMultilineText(content, BODY_SIZE, helvetica, gray);

      y -= 10; // Space between clauses
    }

    y -= 15; // Space between sections
  }

  // ========================
  // SIGNATURE PAGE
  // ========================

  if (options.includeSignaturePages) {
    addNewPage();

    y -= 20;
    currentPage.drawText('SIGNATURES', {
      x: PAGE_MARGIN,
      y,
      size: HEADING_SIZE,
      font: helveticaBold,
      color: primaryBlue,
    });
    y -= 8;
    currentPage.drawLine({
      start: { x: PAGE_MARGIN, y },
      end: { x: width - PAGE_MARGIN, y },
      thickness: 0.5,
      color: primaryBlue,
    });
    y -= 30;

    const declarationText = 'By signing below, each party confirms they have read, understood, and agree to be bound by the terms set out in this agreement.';
    drawWrappedText(declarationText, BODY_SIZE, helvetica, gray);
    y -= 40;

    // Landlord signature block
    currentPage.drawText('LANDLORD / AGENT:', {
      x: PAGE_MARGIN,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    y -= 25;

    currentPage.drawText('Signature:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawLine({
      start: { x: PAGE_MARGIN + 70, y: y - 5 },
      end: { x: width / 2 - 20, y: y - 5 },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 25;

    currentPage.drawText('Name:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawText(formData.landlordName || '________________________', {
      x: PAGE_MARGIN + 70,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: black,
    });
    y -= 20;

    currentPage.drawText('Date:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawLine({
      start: { x: PAGE_MARGIN + 70, y: y - 5 },
      end: { x: PAGE_MARGIN + 200, y: y - 5 },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 50;

    // Tenant signature block
    currentPage.drawText('TENANT:', {
      x: PAGE_MARGIN,
      y,
      size: 10,
      font: helveticaBold,
      color: black,
    });
    y -= 25;

    currentPage.drawText('Signature:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawLine({
      start: { x: PAGE_MARGIN + 70, y: y - 5 },
      end: { x: width / 2 - 20, y: y - 5 },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 25;

    currentPage.drawText('Name:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawText(formData.tenantName || '________________________', {
      x: PAGE_MARGIN + 70,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: black,
    });
    y -= 20;

    currentPage.drawText('Date:', {
      x: PAGE_MARGIN,
      y,
      size: BODY_SIZE,
      font: helvetica,
      color: gray,
    });
    currentPage.drawLine({
      start: { x: PAGE_MARGIN + 70, y: y - 5 },
      end: { x: PAGE_MARGIN + 200, y: y - 5 },
      thickness: 0.5,
      color: lightGray,
    });
  }

  // ========================
  // ADD PAGE NUMBERS
  // ========================

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width: pageWidth } = page.getSize();

    // Footer
    page.drawText(`Page ${i + 1} of ${totalPages}`, {
      x: pageWidth / 2 - 30,
      y: 20,
      size: FOOTER_SIZE,
      font: helvetica,
      color: lightGray,
    });

    // Generated timestamp (on first page only)
    if (i === 0) {
      page.drawText(`Generated: ${new Date().toLocaleString('en-GB')}`, {
        x: PAGE_MARGIN,
        y: 20,
        size: FOOTER_SIZE,
        font: helvetica,
        color: lightGray,
      });
    }
  }

  // Serialize to bytes
  return await pdfDoc.save();
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Convert PDF bytes to a Blob for download
 */
export function pdfBytesToBlob(pdfBytes: Uint8Array | ArrayBuffer): Blob {
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Trigger PDF download in the browser
 */
export function downloadPdf(pdfBytes: Uint8Array | ArrayBuffer, filename: string): void {
  const blob = pdfBytesToBlob(pdfBytes);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Open PDF in a new browser tab
 */
export function openPdfInNewTab(pdfBytes: Uint8Array | ArrayBuffer): void {
  const blob = pdfBytesToBlob(pdfBytes);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
