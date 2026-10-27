const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./database');

async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha;

    if (!email || typeof senha !== 'string' || !senha) {
      return res.status(400).json({ mensagem: 'Informe o e-mail e a senha.' });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('COLOQUE_')) {
      console.error('JWT_SECRET não foi configurada com uma chave forte.');
      return res.status(500).json({ mensagem: 'A autenticação não está configurada corretamente no servidor.' });
    }

    const [usuarios] = await pool.execute(
      `SELECT id_usuario, nome, email, senha_hash, status
       FROM usuario WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!usuarios.length || !usuarios[0].status) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: { id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email }
    });
  } catch (erro) {
    console.error('Erro no login:', erro.message);
    return res.status(500).json({ mensagem: 'Erro ao realizar login.' });
  }
}

module.exports = { login };
