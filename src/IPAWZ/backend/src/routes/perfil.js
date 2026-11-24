/* Perfil de quem está logado + lista pública de instituições. */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, exigirTipo } = require("../middlewares/autenticacao");
const { upload, salvarImagem } = require("../middlewares/upload");
const { verificar } = require("../utils/erros");
const { TIPOS_USUARIO, perfilParaSite } = require("../utils/perfil");
const v = require("../utils/validacao");
const pix = require("../utils/pix");

const router = Router();

// Campos que cada tipo de conta pode editar (nome no JSON -> coluna no banco)
const CAMPOS_COMUNS = {
    telefone: "telefone", descricao: "descricao", rua: "rua", numero: "numero", complemento: "complemento",
    bairro: "bairro", cidade: "cidade", estado: "estado", cep: "cep"
};
const CAMPOS_PF = { ...CAMPOS_COMUNS, nome: "nome", dataNascimento: "data_nascimento", cpf: "cpf" };
const CAMPOS_PJ = { ...CAMPOS_COMUNS, nomeFantasia: "nome", razaoSocial: "razao_social", tipoInstituicao: "tipo_instituicao" };

// Campos que aparecem para qualquer visitante
const CAMPOS_PUBLICOS_INSTITUICAO = "id, nome, razao_social, tipo_instituicao, cidade, estado, telefone, email, foto_url, descricao, status_validacao";

async function salvar(id, alteracoes, mensagem) {
    return perfilParaSite(verificar(
        await supabase.from("perfis").update(alteracoes).eq("id", id).select().single(),
        mensagem
    ));
}

// GET /api/perfil
router.get("/perfil", autenticar, (req, res) => res.json(perfilParaSite(req.usuario)));

// PUT /api/perfil
router.put("/perfil", autenticar, async (req, res) => {
    const mapa = req.usuario.tipo === "pj" ? CAMPOS_PJ : CAMPOS_PF;
    const corpo = req.body || {};
    const alteracoes = {};

    for (const [campoJson, coluna] of Object.entries(mapa)) {
        if (corpo[campoJson] === undefined) continue;
        alteracoes[coluna] = v.vazioParaNull(corpo[campoJson]);
    }
    if (alteracoes.cpf) alteracoes.cpf = v.validarCpf(alteracoes.cpf);
    if (alteracoes.cep) alteracoes.cep = v.somenteDigitos(alteracoes.cep);
    if (alteracoes.estado) alteracoes.estado = alteracoes.estado.toUpperCase().slice(0, 2);
    if (alteracoes.nome === null) delete alteracoes.nome; // nome é obrigatório

    res.json(await salvar(req.usuario.id, alteracoes, "Não foi possível salvar o perfil."));
});

// PUT /api/perfil/tipo-usuario  { tipoUsuario: "simples" | "adotante" | "voluntario" | "multifuncional" }
// Tela "Seleção de perfil". Pode ser trocado depois.
router.put("/perfil/tipo-usuario", autenticar, exigirTipo("pf"), async (req, res) => {
    const tipoUsuario = v.validarOpcao((req.body || {}).tipoUsuario, TIPOS_USUARIO, "tipo de perfil");
    res.json(await salvar(req.usuario.id, { tipo_usuario: tipoUsuario }));
});

// POST /api/perfil/foto  (campo "foto")
router.post("/perfil/foto", autenticar, upload.single("foto"), async (req, res) => {
    const url = await salvarImagem(req.file, `perfis/${req.usuario.id}`);
    res.json(await salvar(req.usuario.id, { foto_url: url }));
});

// PUT /api/perfil/pix  { tipoChave: "cpf"|"cnpj"|"email"|"telefone"|"aleatoria", chave }
// A instituição cadastra (ou troca) a chave que recebe as doações financeiras.
router.put("/perfil/pix", autenticar, exigirTipo("pj"), async (req, res) => {
    const corpo = req.body || {};
    const { tipo, chave } = pix.normalizarChave(corpo.tipoChave, corpo.chave);
    res.json(await salvar(req.usuario.id, { pix_tipo_chave: tipo, pix_chave: chave }, "Não foi possível salvar a chave Pix."));
});

// DELETE /api/perfil/pix  -> para de receber doações financeiras
router.delete("/perfil/pix", autenticar, exigirTipo("pj"), async (req, res) => {
    res.json(await salvar(req.usuario.id, { pix_tipo_chave: null, pix_chave: null }));
});

// GET /api/instituicoes  -> instituições que já enviaram documentos (e não foram rejeitadas)
// "aceita_pix": tem chave Pix e já foi aprovada (a chave em si não sai daqui)
router.get("/instituicoes", async (req, res) => {
    const lista = verificar(
        await supabase.from("perfis").select(`${CAMPOS_PUBLICOS_INSTITUICAO}, pix_tipo_chave`)
            .eq("tipo", "pj").neq("status_validacao", "rejeitado").not("validacao_enviada_em", "is", null)
            .order("nome")
    );
    res.json(lista.map(({ pix_tipo_chave, ...instituicao }) => ({
        ...instituicao,
        aceita_pix: Boolean(pix_tipo_chave) && instituicao.status_validacao === "aprovado"
    })));
});

module.exports = router;
