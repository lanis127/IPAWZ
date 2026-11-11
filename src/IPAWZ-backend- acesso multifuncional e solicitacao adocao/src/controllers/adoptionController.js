const pets = require('../repositories/petRepository');
const adoptions = require('../repositories/adoptionRepository');
const HttpError = require('../utils/httpError');
const { validId, cleanText } = require('../utils/validators');

async function create(req, res) {
  const idPet = req.body.idPet ?? req.body.id_pet;
  if (!validId(idPet)) throw new HttpError(400, 'Informe um identificador de pet válido.');

  const mensagem = cleanText(req.body.mensagem, 3000);
  if (mensagem === undefined) throw new HttpError(400, 'A mensagem deve ter no máximo 3000 caracteres.');

  const pet = await pets.findAvailableById(Number(idPet));
  if (!pet) throw new HttpError(404, 'Pet não encontrado ou indisponível para adoção.');

  const idSolicitacao = await adoptions.create({
    userId: req.user.id,
    petId: Number(idPet),
    mensagem
  });
  return res.status(201).json({
    mensagem: 'Solicitação de adoção enviada com sucesso.',
    solicitacao: {
      id: idSolicitacao, idPet: Number(idPet), nomePet: pet.nome, status: 'pendente'
    }
  });
}

async function mine(req, res) {
  const solicitacoes = await adoptions.listByUser(req.user.id);
  return res.json({ solicitacoes });
}
module.exports = { create, mine };
