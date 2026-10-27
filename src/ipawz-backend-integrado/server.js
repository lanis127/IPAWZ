require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');
const authRoutes = require('./authRoutes');
const petRoutes = require('./petRoutes');
const { upload } = require('./upload');

const app = express();
const PORT = Number(process.env.PORT) || 3006;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => res.json({ mensagem: 'Backend do IPAWZ funcionando.' }));
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);

app.use((erro, _req, res, _next) => {
  if (erro?.name === 'MulterError') {
    if (erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensagem: 'A foto não pode ultrapassar 5 MB.' });
    }
    return res.status(400).json({ mensagem: 'Não foi possível receber o arquivo enviado.' });
  }
  if (erro?.message?.startsWith('A foto deve estar')) {
    return res.status(400).json({ mensagem: erro.message });
  }
  console.error('Erro não tratado:', erro);
  return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

async function iniciarServidor() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('COLOQUE_')) {
      throw new Error('Configure JWT_SECRET no arquivo .env com pelo menos 32 caracteres aleatórios.');
    }
    await pool.query('SELECT 1');
    console.log('MySQL conectado com sucesso.');
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  } catch (erro) {
    console.error('Não foi possível iniciar o servidor:', erro.message);
    process.exitCode = 1;
  }
}

iniciarServidor();
