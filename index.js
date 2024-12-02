const express = require("express");
const multer = require("multer");
const path = require("path");
const mammoth = require("mammoth");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require("fs");
const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.post(
  "/mergeDocx",
  upload.fields([
    { name: "mainFile", maxCount: 1 },
    {
      name: "files",
    },
  ]),

  async (req, res) => {
    const mainFile = req.files["mainFile"][0];
    const annexFiles = req.files["files"];
    const ouputFile = req.body.directory;

    console.log('req.files : ', req.files);
    try {
      let mainDocText = await mammoth.extractRawText({ path: mainFile.path });
      let dataContent = [];
      dataContent.push(new Paragraph(mainDocText.value));
      fs.unlinkSync(mainFile.path);

      for (let annex of annexFiles) {
        let annexText = await mammoth.extractRawText({ path: annex.path });
        dataContent.push(new Paragraph(annexText.value));
        console.log("annex.path : ", annex.path);
        fs.unlinkSync(annex.path);
      }

      const combinedDoc = new Document({
        sections: [
          {
            properties: {},
            children: [...dataContent],
          },
        ],
      });

      const outputPath = `${ouputFile}\\merged.docx`;

      const buffer = await Packer.toBuffer(combinedDoc);
      fs.writeFileSync(outputPath, buffer);

     return  res.send({
        message: "Fichiers fusionnés avec succès.",
        filePath: outputPath,
      });
    } catch (err) {
      if (err.message.includes("no such file or directory")) {
        return res.status(500).send("Aucun fichier ou répertoire de ce nom");
      }
      return res.status(500).send("Erreur lors de la fusion des fichiers.");
    }
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
