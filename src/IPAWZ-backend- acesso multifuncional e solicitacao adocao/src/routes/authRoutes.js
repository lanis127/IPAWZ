const router = require('express').Router();
const controller = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const asyncHandler = require('../utils/asyncHandler');

router.post('/cadastro', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));
module.exports = router;
