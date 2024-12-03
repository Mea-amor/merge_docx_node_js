const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs(pdfFiles, outputName) {

  
  const mergedPdf = await PDFDocument.create();

  for (const pdfFile of pdfFiles) {
    const existingPdfBytes = fs.readFileSync(`./uploads/${pdfFile}`);
    const pdf = await PDFDocument.load(existingPdfBytes);
    
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPages().map((_, index) => index));
    copiedPages.forEach(page => mergedPdf.addPage(page));
    fs.unlinkSync(`./uploads/${pdfFile}`)
  }

  const mergedPdfBytes = await mergedPdf.save();

  fs.writeFileSync(`./${outputName}.pdf`, mergedPdfBytes);
}

module.exports = { mergePDFs };