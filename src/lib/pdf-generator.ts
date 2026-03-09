import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Expense, Invoice, Profile } from "@/types";

interface InvoicePdfOptions {
  includePlatformBranding?: boolean;
}

const getDocumentLabel = (invoiceNumber?: string) =>
  String(invoiceNumber || "").toUpperCase().startsWith("QUO-") ? "QUOTE" : "INVOICE";

/**
 * Get currency symbol from currency code
 */
const getCurrencySymbol = (currency?: string): string => {
  const currencyMap: Record<string, string> = {
    USD: "$",
    ZAR: "R",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
  };
  return currencyMap[currency || "USD"] || "$";
};

/**
 * Load image from URL and convert to base64
 */
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

/**
 * Generate PDF from invoice data
 * Returns base64 string of the PDF
 */
export const generateInvoicePDF = async (
  invoice: Invoice,
  businessProfile?: Profile,
  options: InvoicePdfOptions = {},
): Promise<string> => {
  const includePlatformBranding = options.includePlatformBranding ?? true;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;
  const documentLabel = getDocumentLabel(invoice.invoice_number);

  const currency = getCurrencySymbol(businessProfile?.currency || "USD");

  // Add business logo if available
  if (businessProfile?.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(businessProfile.logo_url);
      if (logoBase64) {
        const logoWidth = 32;
        const logoHeight = 16;
        doc.addImage(logoBase64, "PNG", margin, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 5;
      }
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
      // Continue without logo
    }
  }

  // Business Information (Top Left)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  if (businessProfile?.company_name) {
    doc.text(businessProfile.company_name, margin, yPosition);
    yPosition += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (businessProfile?.business_email) {
    doc.text(businessProfile.business_email, margin, yPosition);
    yPosition += 5;
  }
  if (businessProfile?.business_phone) {
    doc.text(businessProfile.business_phone, margin, yPosition);
    yPosition += 5;
  }

  // Reset position for invoice title
  yPosition = Math.max(yPosition, margin + 25);

  // Invoice Title (Right aligned)
  doc.setFontSize(28);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(documentLabel, pageWidth - margin, yPosition, { align: "right" });

  // Invoice Number and Status (Below title)
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text(`${documentLabel === "QUOTE" ? "Quote" : "Invoice"} #${invoice.invoice_number}`, pageWidth - margin, yPosition, {
    align: "right",
  });
  yPosition += 6;

  // Status badge
  const statusColor: Record<string, [number, number, number]> = {
    draft: [100, 116, 139],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    pending: [234, 179, 8],
    overdue: [239, 68, 68],
  };
  const color = statusColor[invoice.status] || [100, 116, 139];
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - margin, yPosition, {
    align: "right",
  });

  yPosition += 15;

  // Bill To and Invoice Dates Section
  const leftColumnX = margin;
  const rightColumnX = pageWidth / 2 + 10;

  // Bill To Section (Left)
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", leftColumnX, yPosition);

  let billToY = yPosition + 6;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  if (invoice.client?.name) {
    doc.text(invoice.client.name, leftColumnX, billToY);
    billToY += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (invoice.client?.company) {
    doc.text(invoice.client.company, leftColumnX, billToY);
    billToY += 5;
  }
  if (invoice.client?.email) {
    doc.text(invoice.client.email, leftColumnX, billToY);
    billToY += 5;
  }
  if (invoice.client?.phone) {
    doc.text(invoice.client.phone, leftColumnX, billToY);
    billToY += 5;
  }
  if (invoice.client?.address) {
    const clientAddressLines = doc.splitTextToSize(invoice.client.address, 80);
    doc.text(clientAddressLines, leftColumnX, billToY);
    billToY += clientAddressLines.length * 5;
  }

  // Invoice Dates (Right)
  let dateY = yPosition + 6;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice Date:", rightColumnX, dateY);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.invoice_date).toLocaleDateString(), pageWidth - margin, dateY, { align: "right" });
  dateY += 6;

  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Due Date:", rightColumnX, dateY);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(invoice.due_date).toLocaleDateString(), pageWidth - margin, dateY, {
    align: "right",
  });

  yPosition = Math.max(billToY, dateY) + 15;

  // Line Items Table
  const tableData =
    invoice.items?.map((item) => [
      item.description,
      item.quantity.toString(),
      `${currency}${Number(item.unit_price).toFixed(2)}`,
      `${currency}${Number(item.total).toFixed(2)}`,
    ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 85, halign: "left" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: margin, right: margin },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  yPosition = finalY + 10;

  // Totals Section (Right aligned)
  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  doc.setDrawColor(200);
  doc.line(totalsX - 5, yPosition - 5, pageWidth - margin, yPosition - 5);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, yPosition);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`${currency}${Number(invoice.subtotal).toFixed(2)}`, totalsValueX, yPosition, { align: "right" });
  yPosition += 7;

  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax (${invoice.tax_percentage}%):`, totalsX, yPosition);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`${currency}${Number(invoice.tax_amount).toFixed(2)}`, totalsValueX, yPosition, { align: "right" });
  yPosition += 10;

  // Total with background
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(totalsX - 5, yPosition - 6, 75, 10, "F");

  doc.setFontSize(12);
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", totalsX, yPosition);
  doc.text(`${currency}${Number(invoice.total).toFixed(2)}`, totalsValueX - 3, yPosition, { align: "right" });

  yPosition += 15;

  // Notes Section
  if (invoice.notes) {
    if (yPosition + 30 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Notes:", margin, yPosition);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
    yPosition += splitNotes.length * 5;
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });
  if (includePlatformBranding) {
    doc.setFont("helvetica", "normal");
    doc.text("Generated with InvoicePro", pageWidth - margin, footerY, { align: "right" });
  }

  // Return base64 string
  return doc.output("dataurlstring");
};

/**
 * Download invoice PDF
 */
export const downloadInvoicePDF = async (
  invoice: Invoice,
  businessProfile?: Profile,
  options: InvoicePdfOptions = {},
): Promise<void> => {
  const doc = new jsPDF();
  const base64 = await generateInvoicePDF(invoice, businessProfile, options);

  // Extract the base64 data and convert to blob
  const base64Data = base64.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${invoice.invoice_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Open invoice PDF in new tab
 */
export const previewInvoicePDF = async (
  invoice: Invoice,
  businessProfile?: Profile,
  options: InvoicePdfOptions = {},
): Promise<void> => {
  const base64 = await generateInvoicePDF(invoice, businessProfile, options);
  const pdfWindow = window.open();
  if (pdfWindow) {
    pdfWindow.document.write(`<iframe width='100%' height='100%' src='${base64}' frameborder='0'></iframe>`);
  }
};

/**
 * Get PDF as Blob for email attachment
 */
export const getInvoicePDFBlob = async (
  invoice: Invoice,
  businessProfile?: Profile,
  options: InvoicePdfOptions = {},
): Promise<Blob> => {
  const base64 = await generateInvoicePDF(invoice, businessProfile, options);
  const base64Data = base64.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "application/pdf" });
};

export const generateExpenseReceiptPDF = async (expense: Expense, businessProfile?: Profile): Promise<string> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;
  const currency = getCurrencySymbol(expense.currency || businessProfile?.currency || "ZAR");

  if (businessProfile?.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(businessProfile.logo_url);
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, yPosition, 28, 14);
        yPosition += 18;
      }
    } catch (error) {
      console.error("Error adding logo to expense PDF:", error);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  if (businessProfile?.company_name) {
    doc.text(businessProfile.company_name, margin, yPosition);
    yPosition += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (businessProfile?.business_email) {
    doc.text(businessProfile.business_email, margin, yPosition);
    yPosition += 5;
  }
  if (businessProfile?.business_phone) {
    doc.text(businessProfile.business_phone, margin, yPosition);
    yPosition += 5;
  }

  yPosition = Math.max(yPosition, margin + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.text("PAYMENT RECEIPT", pageWidth - margin, margin + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(expense.category, pageWidth - margin, margin + 14, { align: "right" });

  yPosition += 16;
  doc.setDrawColor(220);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  const rows: Array<[string, string]> = [
    ["Recipient", expense.recipient],
    ["Company", expense.recipient_company || expense.recipientCompany || "-"],
    ["Email", expense.recipient_email || expense.recipientEmail || "-"],
    ["Phone", expense.recipient_phone || expense.recipientPhone || "-"],
    ["Date", new Date(expense.date).toLocaleDateString()],
    ["Payment Method", expense.payment_method || expense.paymentMethod || "-"],
    ["Status", expense.status],
    ["Amount", `${currency}${Number(expense.amount).toFixed(2)} ${expense.currency}`],
  ];

  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(String(value), margin + 55, yPosition);
    yPosition += 8;
  });

  if (expense.notes) {
    yPosition += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const splitNotes = doc.splitTextToSize(expense.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
    yPosition += splitNotes.length * 5;
  }

  const footerY = pageHeight - 15;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Payment method recorded for bookkeeping only.", pageWidth / 2, footerY, { align: "center" });

  return doc.output("dataurlstring");
};

export const downloadExpenseReceiptPDF = async (expense: Expense, businessProfile?: Profile): Promise<void> => {
  const base64 = await generateExpenseReceiptPDF(expense, businessProfile);
  const base64Data = base64.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt-${expense.category.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
