const pool = require("../config/database");

async function inativarPet(req, res) {
  try {
    const idPet = Number(req.params.id);
    const idUsuario = req.usuario.id_usuario;
    const { motivo } = req.body || {};

    if (!Number.isInteger(idPet) || idPet <= 0) {
      return res.status(400).json({ mensagem: "ID do pet inválido." });
    }
    if (motivo !== undefined &&
        (typeof motivo !== "string" || motivo.trim().length > 255)) {
      return res.status(400).json({ mensagem: "O motivo deve ter até 255 caracteres." });
    }

    const motivoFinal = motivo && motivo.trim() ? motivo.trim() : "Não informado";

    const [result] = await pool.execute(
      `UPDATE pet
       SET status = 'Inativo', data_inativacao = NOW(), motivo_inativacao = ?
       WHERE id_pet = ? AND id_usuario = ? AND status = 'Disponível'`,
      [motivoFinal, idPet, idUsuario]
    );

    if (!result.affectedRows) {
      const [rows] = await pool.execute(
        "SELECT status FROM pet WHERE id_pet = ? AND id_usuario = ? LIMIT 1",
        [idPet, idUsuario]
      );
      if (!rows.length) {
        return res.status(404).json({
          mensagem: "Pet não encontrado ou você não tem permissão para inativá-lo."
        });
      }
      if (rows[0].status === "Inativo") {
        return res.status(409).json({ mensagem: "Este pet já está inativo." });
      }
      return res.status(409).json({
        mensagem: "Somente pets disponíveis podem ser inativados."
      });
    }

    return res.status(200).json({
      mensagem: "Pet inativado com sucesso.",
      pet: { id_pet: idPet, status: "Inativo", motivo: motivoFinal }
    });
  } catch (error) {
    console.error("Erro ao inativar pet:", error);
    return res.status(500).json({ mensagem: "Erro interno ao inativar o pet." });
  }
}

async function listarPetsDisponiveis(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id_pet, nome, especie, raca, idade, sexo, porte,
              descricao, foto_url, status, data_cadastro
       FROM pet WHERE status = 'Disponível'
       ORDER BY data_cadastro DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erro ao listar pets:", error);
    return res.status(500).json({ mensagem: "Erro ao listar pets." });
  }
}

async function listarMeusPets(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id_pet, nome, especie, raca, idade, sexo, porte,
              descricao, foto_url, status, data_cadastro,
              data_inativacao, motivo_inativacao
       FROM pet WHERE id_usuario = ? ORDER BY data_cadastro DESC`,
      [req.usuario.id_usuario]
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erro ao listar seus pets:", error);
    return res.status(500).json({ mensagem: "Erro ao listar seus pets." });
  }
}

module.exports = { inativarPet, listarPetsDisponiveis, listarMeusPets };
