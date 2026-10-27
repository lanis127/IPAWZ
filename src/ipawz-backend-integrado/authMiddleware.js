const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token de autenticação não informado.' });
  }

  const token = cabecalho.slice('Bearer '.length).trim();
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    if (!dados.id_usuario) {
      return res.status(401).json({ mensagem: 'Token inválido.' });
    }
    req.usuario = { id_usuario: Number(dados.id_usuario), email: dados.email };
    return next();
  } catch (erro) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticar;
