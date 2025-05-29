// src/config/multer.config.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Diretório de uploads (relativo à raiz do projeto backend)
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'images');

// Garante que o diretório de upload exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Onde salvar os arquivos
  },
  filename: (req, file, cb) => {
    // Define um nome de arquivo único para evitar sobrescrever
    // Ex: timestamp-nomeoriginal.extensao
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas certos tipos de imagem
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas imagens JPEG, PNG, GIF, WEBP são permitidas.'), false);
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;