const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const { permissionsForProfile } = require('../constants/permissions');

router.get('/', authenticate, (req, res) => {
  res.json({
    perfil: req.user.perfil,
    permissoes: permissionsForProfile(req.user.perfil)
  });
});
module.exports = router;
