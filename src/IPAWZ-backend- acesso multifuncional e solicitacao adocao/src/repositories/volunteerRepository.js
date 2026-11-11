const db = require('../config/database');

async function create({ userId, mensagem, disponibilidade }) {
  const [result] = await db.execute(
    `INSERT INTO candidaturas_voluntariado
       (id_usuario, mensagem, disponibilidade, status)
     VALUES (?, ?, ?, 'pendente')`,
    [userId, mensagem, disponibilidade]
  );
  return result.insertId;
}
module.exports = { create };
