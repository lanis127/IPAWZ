const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token não informado ou malformado." });
  }

  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const idUsuario = payload.id_usuario ?? payload.id;
    if (!idUsuario) {
      return res.status(401).json({ mensagem: "Token sem identificação do usuário." });
    }
    req.usuario = { ...payload, id_usuario: idUsuario };
    next();
  } catch (error) {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
}

module.exports = authMiddleware;
