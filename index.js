const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();
const port = 3000;
const fs = require("fs").promises;
const fsNoPromise = require("fs");
const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

const { mergePDFs } = require("./mainMergePdf");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

if (!fsNoPromise.existsSync("uploads")) {
  fsNoPromise.mkdirSync("uploads");
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
    console.log("starting script for converting docx to pdf ...");
    const mainFile = req.files["mainFile"][0];
    const annexFiles = req.files["files"];
    const typeRepertory = req.body.sendTo;
    const directory = req.body.directory;
    const outputPathPdfFileMerge = `${typeRepertory}/${directory}/`;
    const pdfFilesPath = [];
    const filePathToDelete = []

    if (!fsNoPromise.existsSync(typeRepertory)) {
      fsNoPromise.mkdirSync(typeRepertory);
    }
    
    if (!fsNoPromise.existsSync(outputPathPdfFileMerge)) {
      fsNoPromise.mkdirSync(outputPathPdfFileMerge);
    }

    try {
      
      await main(mainFile.path, mainFile.originalname)
        .then((resp) => {
          filePathToDelete.push(mainFile.path);
          pdfFilesPath.push(`${mainFile.originalname}.pdf`);
        })
        .catch(function (err) {
          console.log(`Error converting file: ${err}`);
        });
      for (let annex of annexFiles) {

        await main(annex.path, annex.originalname)
          .then((resp) => {
            filePathToDelete.push(annex.path);
            pdfFilesPath.push(`${annex.originalname}.pdf`);
          })
          .catch(function (err) {
            console.log(`Error converting file: ${err}`);
          });
      }

      console.log("starting script for merging pdf ...");
      const mergeFilePath = outputPathPdfFileMerge+ mainFile.originalname;

      mergePDFs(pdfFilesPath, mergeFilePath)
        .then(() => {
          console.log("PDFs merged successfully");
          filePathToDelete.forEach(path=>{
            fsNoPromise.unlinkSync(path);
          });

          pdfFilesPath.forEach(path=>{
            fsNoPromise.unlinkSync(`./uploads/${path}`)
          })

          return res.send({
            message: "Fichiers fusionnés avec succès.",
            filePath: "outputPath",
          });
        })
        .catch((err) => console.error("Error merging PDFs:", err));
    } catch (err) {
      console.log("err : ", err);
      if (err.message.includes("no such file or directory")) {
        return res.status(500).send("Aucun fichier ou répertoire de ce nom");
      }
      return res.status(500).send("Erreur lors de la fusion des fichiers.");
    }
  }
);

async function main(inputPath, originalname) {
  const ext = ".pdf";
  const outputPath = path.join(__dirname, `./uploads/${originalname}${ext}`);

  const docxBuf = await fs.readFile(inputPath);

  let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

  await fs.writeFile(outputPath, pdfBuf);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
