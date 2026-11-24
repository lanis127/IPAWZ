/* Vagas de voluntariado (criadas por instituições validadas) e candidaturas
   (feitas por PF com perfil voluntário/multifuncional e validação enviada). */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, exigirTipo, exigirPermissao, exigirValidacao } = require("../middlewares/autenticacao");
const { upload, salvarImagem } = require("../middlewares/upload");
const { ErroHttp, verificar } = require("../utils/erros");
const v = require("../utils/validacao");

const router = Router();

const STATUS_CANDIDATURA = ["enviada", "analise", "aceita", "negada"];
const INSTITUICAO = "instituicao:perfis(id, nome, cidade, estado, foto_url)";

function lerVaga(corpo) {
    v.exigirCampos(corpo, ["tipoServico", "local", "data", "descricao"]);
    const tipo = v.texto(corpo.tipoServico);
    if (tipo === "outro" && !v.texto(corpo.tipoOutro)) throw new ErroHttp(400, "Descreva o tipo de serviço.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(corpo.data)) throw new ErroHttp(400, "Data inválida.");
    return {
        tipo_servico: tipo,
        tipo_outro: tipo === "outro" ? v.texto(corpo.tipoOutro) : null,
        local: v.texto(corpo.local),
        data: corpo.data,
        descricao: v.texto(corpo.descricao)
    };
}

async function vagaDaInstituicao(id, usuario) {
    const vaga = verificar(await supabase.from("vagas").select("*").eq("id", id).maybeSingle());
    if (!vaga) throw new ErroHttp(404, "Vaga não encontrada.");
    if (vaga.instituicao_id !== usuario.id) throw new ErroHttp(403, "Esta vaga é de outra instituição.");
    return vaga;
}

/* ---------------- VAGAS ---------------- */

// GET /api/vagas  -> vagas ativas (público)
router.get("/vagas", async (req, res) => {
    let consulta = supabase.from("vagas").select(`*, ${INSTITUICAO}`).eq("ativa", true);
    if (req.query.busca) consulta = consulta.ilike("tipo_servico", `%${v.texto(req.query.busca)}%`);
    const vagas = verificar(await consulta.order("data", { ascending: true }));
    res.json(vagas);
});

// GET /api/vagas/minhas  -> vagas da instituição logada, com candidatos
router.get("/vagas/minhas", autenticar, exigirTipo("pj"), async (req, res) => {
    const vagas = verificar(
        await supabase
            .from("vagas")
            .select("*, candidaturas(id, status, mensagem, criado_em, voluntario:perfis(id, nome, email, telefone, cidade, estado, experiencia_animais, experiencia_descricao, status_validacao))")
            .eq("instituicao_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(vagas);
});

// GET /api/vagas/:id
router.get("/vagas/:id", async (req, res) => {
    const vaga = verificar(
        await supabase.from("vagas").select(`*, ${INSTITUICAO}`).eq("id", v.idNumerico(req.params.id)).maybeSingle()
    );
    if (!vaga) throw new ErroHttp(404, "Vaga não encontrada.");
    res.json(vaga);
});

// POST /api/vagas  (pode mandar uma imagem no campo "imagem")
router.post("/vagas", autenticar, exigirTipo("pj"), exigirValidacao, upload.single("imagem"), async (req, res) => {
    const vaga = lerVaga(req.body || {});
    vaga.instituicao_id = req.usuario.id;
    vaga.imagem_url = await salvarImagem(req.file, `vagas/${req.usuario.id}`);
    const criada = verificar(await supabase.from("vagas").insert(vaga).select().single());
    res.status(201).json(criada);
});

// PUT /api/vagas/:id
router.put("/vagas/:id", autenticar, exigirTipo("pj"), exigirValidacao, upload.single("imagem"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    await vagaDaInstituicao(id, req.usuario);
    const alteracoes = lerVaga(req.body || {});
    if (req.file) alteracoes.imagem_url = await salvarImagem(req.file, `vagas/${req.usuario.id}`);
    const vaga = verificar(await supabase.from("vagas").update(alteracoes).eq("id", id).select().single());
    res.json(vaga);
});

// PATCH /api/vagas/:id/ativa  { ativa: true|false }
router.patch("/vagas/:id/ativa", autenticar, exigirTipo("pj"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    await vagaDaInstituicao(id, req.usuario);
    const vaga = verificar(
        await supabase.from("vagas").update({ ativa: Boolean((req.body || {}).ativa) }).eq("id", id).select().single()
    );
    res.json(vaga);
});

/* ---------------- CANDIDATURAS ---------------- */

// POST /api/vagas/:id/candidaturas  { mensagem }
router.post("/vagas/:id/candidaturas", autenticar, exigirTipo("pf"), exigirPermissao("voluntariado"), exigirValidacao, async (req, res) => {
    const vagaId = v.idNumerico(req.params.id);
    const vaga = verificar(await supabase.from("vagas").select("id, ativa").eq("id", vagaId).maybeSingle());
    if (!vaga) throw new ErroHttp(404, "Vaga não encontrada.");
    if (!vaga.ativa) throw new ErroHttp(409, "Esta vaga não está mais aceitando candidaturas.");

    const { data, error } = await supabase
        .from("candidaturas")
        .insert({ vaga_id: vagaId, voluntario_id: req.usuario.id, mensagem: v.vazioParaNull((req.body || {}).mensagem) })
        .select()
        .single();
    if (error && error.code === "23505") throw new ErroHttp(409, "Você já se candidatou a esta vaga.");
    verificar({ data, error });
    res.status(201).json(data);
});

// GET /api/candidaturas/minhas
router.get("/candidaturas/minhas", autenticar, exigirTipo("pf"), async (req, res) => {
    const lista = verificar(
        await supabase
            .from("candidaturas")
            .select(`id, status, mensagem, criado_em, atualizado_em, vaga:vagas(id, tipo_servico, tipo_outro, local, data, ${INSTITUICAO})`)
            .eq("voluntario_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(lista);
});

// PATCH /api/candidaturas/:id/status  { status }
router.patch("/candidaturas/:id/status", autenticar, exigirTipo("pj"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    const status = v.validarOpcao((req.body || {}).status, STATUS_CANDIDATURA, "status");

    const candidatura = verificar(
        await supabase.from("candidaturas").select("id, vaga:vagas(instituicao_id)").eq("id", id).maybeSingle()
    );
    if (!candidatura) throw new ErroHttp(404, "Candidatura não encontrada.");
    if (candidatura.vaga.instituicao_id !== req.usuario.id) throw new ErroHttp(403, "Esta candidatura é de outra instituição.");

    const atualizada = verificar(await supabase.from("candidaturas").update({ status }).eq("id", id).select().single());
    res.json(atualizada);
});

module.exports = router;
