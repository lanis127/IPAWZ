const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../repositories/userRepository');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { permissionsForProfile, resolveProfile } = require('../constants/permissions');
const HttpError = require('../utils/httpError');
const { validEmail } = require('../utils/validators');

function createToken(user) {
  return jwt.sign(
    { email: user.email, perfil: user.perfil },
    jwtSecret,
    { subject: String(user.id), expiresIn: jwtExpiresIn }
  );
}

async function register(req, res) {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = req.body.senha;
  const opcoesPerfil = req.body.opcoesPerfil || {};

  if (nome.length < 2 || nome.length > 150) {
    throw new HttpError(400, 'Informe um nome entre 2 e 150 caracteres.');
  }
  if (!validEmail(email)) throw new HttpError(400, 'Informe um e-mail válido.');
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72) {
    throw new HttpError(400, 'A senha deve ter entre 8 e 72 caracteres.');
  }
  if (typeof opcoesPerfil !== 'object' || Array.isArray(opcoesPerfil)) {
    throw new HttpError(400, 'As opções de perfil são inválidas.');
  }
  if (['adotar', 'adotante', 'voluntariar', 'voluntariado'].some(
    key => opcoesPerfil[key] !== undefined && typeof opcoesPerfil[key] !== 'boolean'
  )) {
    throw new HttpError(400, 'As opções adotar e voluntariar devem ser booleanas.');
  }

  const perfil = resolveProfile(opcoesPerfil);
  const senhaHash = await bcrypt.hash(senha, 12);
  try {
    const id = await users.create({ nome, email, senhaHash, perfil });
    const user = { id, nome, email, perfil };
    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso.',
      token: createToken(user),
      usuario: { ...user, permissoes: permissionsForProfile(perfil) }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Este e-mail já está cadastrado.');
    throw error;
  }
}

async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = req.body.senha;
  if (!validEmail(email) || typeof senha !== 'string' || !senha) {
    throw new HttpError(400, 'Informe um e-mail válido e a senha.');
  }
  const user = await users.findByEmail(email);
  if (!user || !user.ativo || !(await bcrypt.compare(senha, user.senhaHash))) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }
  const token = createToken(user);
  return res.json({
    mensagem: 'Login realizado com sucesso.',
    token,
    usuario: {
      id: user.id, nome: user.nome, email: user.email, perfil: user.perfil,
      permissoes: permissionsForProfile(user.perfil)
    }
  });
}

async function me(req, res) {
  const user = await users.findPublicById(req.user.id);
  if (!user || !user.ativo) throw new HttpError(401, 'Usuário não encontrado ou inativo.');
  return res.json({
    usuario: {
      id: user.id, nome: user.nome, email: user.email, perfil: user.perfil,
      permissoes: permissionsForProfile(user.perfil)
    }
  });
}
module.exports = { register, login, me };
