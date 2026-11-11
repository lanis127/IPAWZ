const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { permissionsForProfile } = require('../constants/permissions');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ mensagem: 'Autenticação necessária.' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      perfil: payload.perfil,
      permissoes: permissionsForProfile(payload.perfil)
    };
    return next();
  } catch {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}
module.exports = authenticate;
