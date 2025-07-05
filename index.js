import express from "express";
import multer from "multer";
import fs from "fs";
import archiver from "archiver";
import path from "path";
import { convert } from "pdf-poppler";

const app = express();
const upload = multer({ dest: "uploads/" });

// Create necessary directories
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}
if (!fs.existsSync("output")) {
  fs.mkdirSync("output", { recursive: true });
}

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

app.post("/convert", upload.array("files"), async (req, res) => {
  const mode = req.body.mode;

  if (!mode || !["pdf2jpg", "jpg2pdf"].includes(mode)) {
    return res.status(400).send("Modalità non valida");
  }

  const inputFiles = req.files;
  const outputPath = `output/output_${Date.now()}`;
  fs.mkdirSync(outputPath, { recursive: true });

  try {
    if (mode === "pdf2jpg") {
      const pdfPath = inputFiles[0].path;
      const options = {
        format: 'jpeg',
        out_dir: outputPath,
        out_prefix: 'page',
        page: null
      };

      await convert(pdfPath, options);

    } else if (mode === "jpg2pdf") {
      // Creazione PDF da immagini
      const PDFDocument = (await import("pdf-lib")).PDFDocument;
      const pdfDoc = await PDFDocument.create();

      for (const file of inputFiles) {
        const imageBytes = fs.readFileSync(file.path);
        const jpgImage = await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
        page.drawImage(jpgImage, { x: 0, y: 0 });
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(`${outputPath}/output.pdf`, pdfBytes);
    }

    // Zippa il risultato
    const zipName = `output_${Date.now()}.zip`;
    const zipPath = `output/${zipName}`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(outputPath, false);
    await archive.finalize();

    res.download(zipPath);

  } catch (err) {
    console.error("Errore nella conversione:", err);
    res.status(500).send("Errore durante la conversione.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server attivo su http://localhost:${PORT}`);
});
