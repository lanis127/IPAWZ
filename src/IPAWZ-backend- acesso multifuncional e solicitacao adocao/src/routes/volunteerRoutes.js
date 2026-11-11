const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const { requirePermission } = require('../middlewares/authorize');
const controller = require('../controllers/volunteerController');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate);
router.post('/candidaturas', requirePermission('voluntariar'), asyncHandler(controller.apply));
module.exports = router;
