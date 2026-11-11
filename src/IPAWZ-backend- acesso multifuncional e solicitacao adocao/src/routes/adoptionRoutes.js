const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const { requirePermission } = require('../middlewares/authorize');
const controller = require('../controllers/adoptionController');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);
router.post('/', requirePermission('adotar'), asyncHandler(controller.create));
router.get('/minhas', requirePermission('adotar'), asyncHandler(controller.mine));
module.exports = router;
