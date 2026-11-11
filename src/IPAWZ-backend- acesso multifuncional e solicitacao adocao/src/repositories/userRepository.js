const db = require('../config/database');

async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT id_usuario AS id, nome, email, senha_hash AS senhaHash, perfil, ativo
     FROM usuarios WHERE email = ? LIMIT 1`, [email]
  );
  return rows[0] || null;
}
async function findPublicById(id) {
  const [rows] = await db.execute(
    `SELECT id_usuario AS id, nome, email, perfil, ativo
     FROM usuarios WHERE id_usuario = ? LIMIT 1`, [id]
  );
  return rows[0] || null;
}
async function create({ nome, email, senhaHash, perfil }) {
  const [result] = await db.execute(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
     VALUES (?, ?, ?, ?, 1)`,
    [nome, email, senhaHash, perfil]
  );
  return result.insertId;
}
module.exports = { findByEmail, findPublicById, create };
