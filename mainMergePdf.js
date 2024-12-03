const PDFMerger = require('pdf-merger-js');
const path = require('path');

const mergePDFs = async (outputPath, files) => {
    const merger = new PDFMerger();

    for (const file of files) {
        await merger.add(file); // Add each PDF file to the merger
    }

    await merger.save(outputPath); // Save the merged PDF
    console.log(`PDFs merged successfully! Saved at ${outputPath}`);
};

const filesToMerge = [
    path.join(__dirname, 'file1.pdf'),
    path.join(__dirname, 'test1.pdf'),
];

const outputFilePath = path.join(__dirname, 'merged.pdf');

mergePDFs(outputFilePath, filesToMerge).catch(console.error);
