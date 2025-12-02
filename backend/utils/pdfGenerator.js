const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

function generateInvoicePDF(invoice, tenantSettings, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

  doc.pipe(res);

  // --- Constants ---
  const primaryColor = '#0891B2'; // Cyan for accents
  const fontColorDark = '#1F2937'; // Darker grey for text
  const fontColorLight = '#6B7280'; // Lighter grey for secondary text
  const pageMargin = 50;

  // --- Header ---
  // Placeholder for a logo
  // doc.image('path/to/logo.png', pageMargin, 40, { width: 50 });
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(fontColorDark)
    .text('INVOICE', { align: 'right' });

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(fontColorLight)
    .text(tenantSettings.companyName || 'Your Company', { align: 'right' })
    .text(tenantSettings.companyAddress || '123 Main St', { align: 'right' })
    .text(tenantSettings.companyPhone || '555-1234', { align: 'right' });

  doc.moveDown(3);

  // --- Information Block ---
  const infoTop = doc.y;
  doc
    .fontSize(10)
    .fillColor(fontColorLight)
    .text('BILLED TO', pageMargin, infoTop)
    .fillColor(fontColorDark)
    .font('Helvetica-Bold')
    .text(invoice.mikrotikUser.officialName, pageMargin, infoTop + 15)
    .font('Helvetica')
    .text(invoice.mikrotikUser.mobileNumber, pageMargin, infoTop + 30);

  doc
    .fillColor(fontColorLight)
    .font('Helvetica')
    .text('Invoice Number:', 300, infoTop)
    .text('Date of Issue:', 300, infoTop + 15)
    .text('Due Date:', 300, infoTop + 30)
    .fillColor(fontColorDark)
    .font('Helvetica-Bold')
    .text(invoice.invoiceNumber, 400, infoTop)
    .font('Helvetica')
    .text(format(new Date(invoice.createdAt), 'PPP'), 400, infoTop + 15)
    .text(format(new Date(invoice.dueDate), 'PPP'), 400, infoTop + 30);

  doc.moveDown(3);

  // --- Table ---
  const tableTop = doc.y;
  doc
    .fontSize(10)
    .fillColor(fontColorLight)
    .font('Helvetica-Bold')
    .text('ITEM DESCRIPTION', pageMargin, tableTop)
    .text('AMOUNT', 0, tableTop, { align: 'right' });

  doc.moveTo(pageMargin, tableTop + 20).lineTo(550, tableTop + 20).strokeColor(fontColorLight).stroke();

  let position = tableTop + 35;
  invoice.items.forEach(item => {
    doc
      .fontSize(10)
      .fillColor(fontColorDark)
      .font('Helvetica-Bold')
      .text(item.description, pageMargin, position)
      .font('Helvetica')
      .text(`KES ${item.amount.toFixed(2)}`, 0, position, { align: 'right' });
    
    position += 30;
    doc.moveTo(pageMargin, position - 10).lineTo(550, position - 10).strokeColor('#EEEEEE').stroke();
  });

  // --- Totals ---
  const totalY = position + 20;
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(fontColorDark)
    .text('Subtotal', pageMargin, totalY, { align: 'right' })
    .text(`KES ${invoice.amount.toFixed(2)}`, 0, totalY, { align: 'right' });

  doc.moveDown(0.5);
  const taxY = doc.y;
  doc
    .text('Tax (0%)', pageMargin, taxY, { align: 'right' })
    .text('KES 0.00', 0, taxY, { align: 'right' });

  doc.moveTo(400, doc.y + 10).lineTo(550, doc.y + 10).strokeColor(fontColorDark).stroke();
  doc.moveDown(0.5);

  const amountDueY = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Total Amount Due', pageMargin, amountDueY, { align: 'right' })
    .text(`KES ${invoice.amount.toFixed(2)}`, 0, amountDueY, { align: 'right' });

  // --- Footer ---
  doc
    .fontSize(8)
    .fillColor(fontColorLight)
    .text(
      'Payment Instructions: Please use the Invoice Number as the account number when paying via M-Pesa.',
      pageMargin,
      750,
      { align: 'center', width: 500 }
    );

  doc.end();
}

module.exports = { generateInvoicePDF };
