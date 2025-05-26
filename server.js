
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const filePath = `/uploads/${req.file.filename}`;
  const fileSize = req.file.size;

  res.json({
    id: req.file.filename,
    name: req.file.originalname,
    src: filePath,
    size: fileSize
  });
});

app.get('/api/images', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to read uploads folder' });

    const images = files.map(filename => ({
      id: filename,
      name: filename,
      src: `/uploads/${filename}`,
      size: fs.statSync(`uploads/${filename}`).size
    }));

    res.json(images);
  });
});

app.delete('/api/images/:id', (req, res) => {
  const filename = req.params.id;
  const filepath = path.join(__dirname, 'uploads', filename);

  fs.unlink(filepath, err => {
    if (err) return res.status(404).json({ message: 'Image not found or already deleted' });

    res.json({ message: 'Image deleted successfully' });
  });
});

app.delete('/api/images/clear', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to read uploads folder' });

    files.forEach(file => {
      fs.unlinkSync(path.join(__dirname, 'uploads', file));
    });

    res.json({ message: 'All images cleared' });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
