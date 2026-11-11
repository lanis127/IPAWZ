const { permissionsForProfile } = require('../constants/permissions');

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ mensagem: 'Autenticação necessária.' });
    const permissions = permissionsForProfile(req.user.perfil);
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        mensagem: 'Seu perfil não possui permissão para realizar esta ação.',
        permissaoNecessaria: permission,
        perfil: req.user.perfil
      });
    }
    return next();
  };
}
module.exports = { requirePermission };
