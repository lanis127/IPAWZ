const volunteers = require('../repositories/volunteerRepository');
const HttpError = require('../utils/httpError');
const { cleanText } = require('../utils/validators');

async function apply(req, res) {
  const mensagem = cleanText(req.body.mensagem, 3000);
  const disponibilidade = cleanText(req.body.disponibilidade, 500);
  if (mensagem === undefined || disponibilidade === undefined) {
    throw new HttpError(400, 'Confira os campos: mensagem (até 3000 caracteres) e disponibilidade (até 500).');
  }
  const id = await volunteers.create({
    userId: req.user.id, mensagem, disponibilidade
  });
  return res.status(201).json({
    mensagem: 'Candidatura enviada com sucesso.',
    candidatura: { id, status: 'pendente' }
  });
}
module.exports = { apply };
