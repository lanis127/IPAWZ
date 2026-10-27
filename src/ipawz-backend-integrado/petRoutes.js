const express = require('express');
const autenticar = require('./authMiddleware');
const { upload } = require('./upload');
const { cadastrarPet } = require('./petController');
const router = express.Router();

// O campo de arquivo no formulário deve se chamar "foto".
router.post('/', autenticar, upload.single('foto'), cadastrarPet);
module.exports = router;
