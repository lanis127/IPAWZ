const db = require('../config/database');

async function create({ userId, petId, mensagem }) {
  const [result] = await db.execute(
    `INSERT INTO solicitacoes_adocao (id_usuario, id_pet, mensagem, status)
     VALUES (?, ?, ?, 'pendente')`,
    [userId, petId, mensagem]
  );
  return result.insertId;
}
async function listByUser(userId) {
  const [rows] = await db.execute(
    `SELECT sa.id_solicitacao AS id, sa.id_pet AS idPet, p.nome AS nomePet,
            sa.mensagem, sa.status, sa.criado_em AS criadoEm
     FROM solicitacoes_adocao sa
     INNER JOIN pets p ON p.id_pet = sa.id_pet
     WHERE sa.id_usuario = ?
     ORDER BY sa.criado_em DESC`, [userId]
  );
  return rows;
}
module.exports = { create, listByUser };
