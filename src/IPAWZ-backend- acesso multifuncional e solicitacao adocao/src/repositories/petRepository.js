const db = require('../config/database');

async function findAvailableById(idPet) {
  const [rows] = await db.execute(
    `SELECT id_pet AS id, nome, status FROM pets
     WHERE id_pet = ? AND status = 'disponivel' LIMIT 1`, [idPet]
  );
  return rows[0] || null;
}
module.exports = { findAvailableById };
