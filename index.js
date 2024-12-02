const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const fileTypes = /docx/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (extName) {
        cb(null, true);
    } else {
        cb(new Error('Only .docx files are allowed!'));
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        res.status(200).json({ message: 'File uploaded successfully!', file: req.file });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
