const express = require("express");
const { body } = require("express-validator");
const { cadastrar, login } = require("../controllers/authController");

const router = express.Router();

const validarLogin = [
    body("email").isEmail().withMessage("E-mail inválido.").normalizeEmail(),
    body("senha").notEmpty().withMessage("Senha é obrigatória.")
];

function tratarErros(req, res, next) {
    const { validationResult } = require("express-validator");
    const erros = validationResult(req);

    if (!erros.isEmpty()) {
        return res.status(400).json({
            mensagem: "Dados inválidos.",
            erros: erros.array()
        });
    }

    next();
}

router.post("/login", validarLogin, tratarErros, login);

module.exports = router;