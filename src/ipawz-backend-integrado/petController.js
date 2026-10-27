const fs = require('fs/promises');
const path = require('path');
const pool = require('./database');
const { pastaUploads } = require('./upload');

const valoresSimNao = new Set(['sim', 'não', 'nao']);
const normalizarSimNao = (valor) => {
  const texto = String(valor ?? '').trim().toLowerCase();
  if (texto === 'nao') return 'não';
  return texto;
};
const opcional = (valor) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') return null;
  return String(valor).trim();
};

async function apagarFoto(file) {
  if (!file) return;
  try { await fs.unlink(file.path); } catch (_erro) { /* arquivo pode já ter sido removido */ }
}

async function cadastrarPet(req, res) {
  const foto = req.file;
  try {
    const nome = String(req.body.nome ?? '').trim();
    const porte = String(req.body.porte ?? '').trim();
    const sexo = String(req.body.sexo ?? '').trim();
    const especie = String(req.body.especie ?? '').trim();
    const idadeTexto = String(req.body.idade ?? '').trim();
    const vacinado = normalizarSimNao(req.body.vacinado);
    const castrado = normalizarSimNao(req.body.castrado);
    const doenca = String(req.body.doenca ?? '').trim();

    const erros = [];
    if (!nome) erros.push('O nome é obrigatório.');
    if (!porte) erros.push('O porte é obrigatório.');
    if (!sexo) erros.push('O sexo é obrigatório.');
    if (!especie) erros.push('A espécie é obrigatória.');
    if (!idadeTexto || !/^\d+$/.test(idadeTexto) || Number(idadeTexto) <= 0 || !Number.isSafeInteger(Number(idadeTexto))) {
      erros.push('A idade deve ser um número inteiro maior que zero.');
    }
    if (!valoresSimNao.has(vacinado)) erros.push('O campo vacinado deve ser "sim" ou "não".');
    if (!valoresSimNao.has(castrado)) erros.push('O campo castrado deve ser "sim" ou "não".');
    if (!doenca) erros.push('Informe a doença ou escreva "Nenhuma".');
    if (!foto) erros.push('A foto do pet é obrigatória. Envie o campo "foto".');

    if (erros.length) {
      await apagarFoto(foto);
      return res.status(400).json({ mensagem: 'Confira os dados do pet.', erros });
    }

    const temperamento = opcional(req.body.temperamento);
    const sociavelComPets = opcional(req.body.sociavel_com_pets);
    const sociavelComPessoas = opcional(req.body.sociavel_com_pessoas);
    const descricao = opcional(req.body.descricao);
    const raca = opcional(req.body.raca);
    const fotoUrl = `/uploads/${path.basename(foto.filename)}`;

    const [resultado] = await pool.execute(
      `INSERT INTO pet
       (id_usuario, id_instituicao, nome, especie, raca, idade, sexo, porte,
        descricao, foto_url, vacinado, castrado, doenca, temperamento,
        sociavel_com_pets, sociavel_com_pessoas, status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Disponível')`,
      [
        req.usuario.id_usuario, nome, especie, raca, Number(idadeTexto), sexo, porte,
        descricao, fotoUrl, vacinado, castrado, doenca, temperamento,
        sociavelComPets, sociavelComPessoas
      ]
    );

    return res.status(201).json({
      mensagem: 'Pet cadastrado com sucesso.',
      pet: {
        id_pet: resultado.insertId,
        id_usuario: req.usuario.id_usuario,
        nome, porte, sexo, idade: Number(idadeTexto), especie,
        vacinado, castrado, doenca, foto_url: fotoUrl,
        temperamento, sociavel_com_pets: sociavelComPets,
        sociavel_com_pessoas: sociavelComPessoas,
        status: 'Disponível'
      }
    });
  } catch (erro) {
    await apagarFoto(foto);
    console.error('Erro ao cadastrar pet:', erro.message);
    if (erro.code === 'ER_BAD_FIELD_ERROR' || erro.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        mensagem: 'A estrutura do banco ainda não está atualizada. Execute a migração SQL incluída no pacote.'
      });
    }
    return res.status(500).json({ mensagem: 'Não foi possível cadastrar o pet.' });
  }
}

module.exports = { cadastrarPet };
