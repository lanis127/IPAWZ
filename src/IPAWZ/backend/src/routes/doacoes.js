/* Doações: qualquer pessoa pode registrar uma intenção de doação (com ou sem login).
   Instituições não doam: só recebem. PF vê as que fez; PJ vê as que recebeu.

   Doação FINANCEIRA = só Pix. O backend gera o "Pix copia e cola" com a chave da
   instituição e o valor escolhido; o site desenha o QR Code. O dinheiro vai direto
   para a instituição, que confirma o recebimento em "Doações recebidas". */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, autenticarOpcional, exigirTipo } = require("../middlewares/autenticacao");
const { ErroHttp, verificar } = require("../utils/erros");
const v = require("../utils/validacao");
const pix = require("../utils/pix");

const router = Router();

const TIPOS = ["financeira", "alimentos", "medicamentos", "acessorios", "higiene"];
// Campos extras aceitos em "detalhes" (o resto é ignorado)
const CAMPOS_DETALHES = ["item", "quantidade", "validade", "embalagem", "lacre", "condicao"];
const VALOR_MINIMO = 1;
const VALOR_MAXIMO = 10000;
const CAMPOS_INSTITUICAO_PIX = "id, nome, cidade, status_validacao, pix_tipo_chave, pix_chave";

const recebePix = (instituicao) => Boolean(instituicao && instituicao.pix_chave) && instituicao.status_validacao === "aprovado";

// O que o site precisa para mostrar o QR Code (a chave vai mascarada; o código completo está no copia e cola)
function dadosDoPix(doacao, instituicao) {
    return {
        copiaECola: pix.gerarCopiaECola({
            chave: instituicao.pix_chave,
            nome: instituicao.nome,
            cidade: instituicao.cidade,
            valor: doacao.valor,
            txid: doacao.detalhes.txid,
            mensagem: "Doacao IPAWZ"
        }),
        valor: Number(doacao.valor),
        recebedor: instituicao.nome,
        tipoChave: pix.NOME_TIPO_CHAVE[instituicao.pix_tipo_chave],
        chave: pix.mascararChave(instituicao.pix_tipo_chave, instituicao.pix_chave),
        identificador: doacao.detalhes.txid
    };
}

// POST /api/doacoes
router.post("/", autenticarOpcional, async (req, res) => {
    const corpo = req.body || {};
    if (req.usuario && req.usuario.tipo === "pj") throw new ErroHttp(403, "Instituições recebem doações, mas não fazem doações pela plataforma.", undefined, "TIPO_DE_CONTA");
    const tipo = v.validarOpcao(corpo.tipo, TIPOS, "tipo de doação");
    v.exigirCampos(corpo, ["nome", "email", "instituicaoId"]);
    // o id é um UUID; um valor qualquer faria o Postgres dar erro 500
    if (!/^[0-9a-f-]{36}$/i.test(String(corpo.instituicaoId))) throw new ErroHttp(400, "Escolha uma instituição válida.");

    const instituicao = verificar(
        await supabase.from("perfis").select(CAMPOS_INSTITUICAO_PIX).eq("id", corpo.instituicaoId).eq("tipo", "pj").maybeSingle()
    );
    if (!instituicao || instituicao.status_validacao === "rejeitado") throw new ErroHttp(400, "Escolha uma instituição válida.");

    const detalhes = {};
    for (const campo of CAMPOS_DETALHES) {
        if (v.texto(corpo[campo])) detalhes[campo] = v.texto(corpo[campo]);
    }

    let valor = null;
    if (tipo === "financeira") {
        if (!recebePix(instituicao)) throw new ErroHttp(400, "Esta instituição ainda não recebe doações por Pix. Escolha outra ou faça uma doação de itens.", undefined, "SEM_PIX");
        valor = Math.round(Number(String(corpo.valor).replace(",", ".")) * 100) / 100;
        if (!(valor >= VALOR_MINIMO)) throw new ErroHttp(400, "O valor mínimo da doação é R$ 1,00.");
        if (valor > VALOR_MAXIMO) throw new ErroHttp(400, "O valor máximo por doação é R$ 10.000,00.");
        detalhes.metodo = "PIX";
    } else if (!detalhes.item) {
        throw new ErroHttp(400, "Informe o item que será doado.");
    }

    let doacao = verificar(
        await supabase
            .from("doacoes")
            .insert({
                tipo,
                valor,
                detalhes,
                instituicao_id: instituicao.id,
                doador_id: req.usuario ? req.usuario.id : null,
                nome: v.texto(corpo.nome),
                email: v.validarEmail(corpo.email),
                telefone: v.vazioParaNull(corpo.telefone),
                observacoes: v.vazioParaNull(corpo.observacoes)
            })
            .select()
            .single(),
        "Não foi possível registrar a doação."
    );

    if (tipo === "financeira") {
        // identificador que aparece no comprovante de muitos bancos e ajuda a ONG a achar o Pix
        doacao = verificar(
            await supabase.from("doacoes").update({ detalhes: { ...doacao.detalhes, txid: `IPAWZD${doacao.id}` } })
                .eq("id", doacao.id).select().single()
        );
        doacao.pix = dadosDoPix(doacao, instituicao);
    }
    res.status(201).json(doacao);
});

// GET /api/doacoes/:id/pix  -> mostra de novo o QR Code de uma doação financeira ainda não confirmada
router.get("/:id/pix", autenticar, exigirTipo("pf"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    const doacao = verificar(await supabase.from("doacoes").select("id, tipo, valor, detalhes, status, doador_id, instituicao_id").eq("id", id).maybeSingle());
    if (!doacao || doacao.doador_id !== req.usuario.id) throw new ErroHttp(404, "Doação não encontrada.");
    if (doacao.tipo !== "financeira") throw new ErroHttp(400, "Só doações financeiras têm Pix.");
    if (doacao.status !== "registrada") throw new ErroHttp(400, "A instituição já confirmou o recebimento desta doação.");

    const instituicao = verificar(await supabase.from("perfis").select(CAMPOS_INSTITUICAO_PIX).eq("id", doacao.instituicao_id).maybeSingle());
    if (!recebePix(instituicao)) throw new ErroHttp(409, "Esta instituição não está recebendo Pix no momento.", undefined, "SEM_PIX");
    if (!doacao.detalhes.txid) doacao.detalhes = { ...doacao.detalhes, txid: `IPAWZD${doacao.id}` };
    res.json(dadosDoPix(doacao, instituicao));
});

const CAMPOS_LISTA = "id, tipo, valor, detalhes, status, nome, email, telefone, observacoes, criado_em";

// GET /api/doacoes/minhas  -> doações que a pessoa física FEZ ("Histórico de doações")
router.get("/minhas", autenticar, exigirTipo("pf"), async (req, res) => {
    const lista = verificar(
        await supabase
            .from("doacoes")
            .select(`${CAMPOS_LISTA}, instituicao:perfis!doacoes_instituicao_id_fkey(nome)`)
            .eq("doador_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(lista);
});

// GET /api/doacoes/recebidas  -> doações que a instituição RECEBEU ("Doações recebidas")
router.get("/recebidas", autenticar, exigirTipo("pj"), async (req, res) => {
    const lista = verificar(
        await supabase
            .from("doacoes")
            .select(`${CAMPOS_LISTA}, doador:perfis!doacoes_doador_id_fkey(nome)`)
            .eq("instituicao_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(lista);
});

// PATCH /api/doacoes/:id/status  (instituição confirma o recebimento)
router.patch("/:id/status", autenticar, exigirTipo("pj"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    const status = v.validarOpcao((req.body || {}).status, ["registrada", "confirmada", "entregue"], "status");
    const doacao = verificar(await supabase.from("doacoes").select("instituicao_id, tipo").eq("id", id).maybeSingle());
    if (!doacao) throw new ErroHttp(404, "Doação não encontrada.");
    if (doacao.instituicao_id !== req.usuario.id) throw new ErroHttp(403, "Só a instituição que recebeu pode alterar.");
    // dinheiro não é "entregue": o Pix só é confirmado
    if (doacao.tipo === "financeira" && status === "entregue") throw new ErroHttp(400, "Doações por Pix só precisam ser confirmadas.");
    const atualizada = verificar(await supabase.from("doacoes").update({ status }).eq("id", id).select().single());
    res.json(atualizada);
});

module.exports = router;
