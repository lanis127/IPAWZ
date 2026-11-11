const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  inativarPet, listarPetsDisponiveis, listarMeusPets
} = require("../controllers/petController");

router.get("/disponiveis", listarPetsDisponiveis);
router.get("/meus", auth, listarMeusPets);
router.patch("/:id/inativar", auth, inativarPet);
// DELETE também é exclusão lógica: não apaga o registro.
router.delete("/:id", auth, inativarPet);

module.exports = router;
