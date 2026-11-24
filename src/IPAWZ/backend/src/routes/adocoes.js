/* Solicitações de adoção.
   - pessoa física (perfil adotante/multifuncional, validada) envia o formulário e acompanha
   - quem cadastrou o pet recebe e responde ("Solicitações recebidas"):
     a instituição, ou a pessoa física que anunciou o próprio pet.
     Cada um vê e responde SÓ as solicitações dos pets que cadastrou. */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, exigirTipo, exigirPermissao, exigirValidacao } = require("../middlewares/autenticacao");
const { ErroHttp, verificar } = require("../utils/erros");
const v = require("../utils/validacao");

const router = Router();

const STATUS = ["enviada", "recebida", "analise", "aprovada", "recusada"];

// POST /api/adocoes  { petId, respostas: { ... } }
router.post("/", autenticar, exigirTipo("pf"), exigirPermissao("adocao"), exigirValidacao, async (req, res) => {
    const corpo = req.body || {};
    const petId = v.idNumerico(corpo.petId);
    if (!corpo.respostas || typeof corpo.respostas !== "object") {
        throw new ErroHttp(400, "Envie as respostas do formulário de adoção.");
    }

    const pet = verificar(await supabase.from("pets").select("id, dono_id, status").eq("id", petId).maybeSingle());
    if (!pet) throw new ErroHttp(404, "Pet não encontrado.");
    if (pet.status !== "disponivel") throw new ErroHttp(409, "Este pet não está mais disponível para adoção.");
    if (pet.dono_id === req.usuario.id) throw new ErroHttp(400, "Você não pode adotar um pet que você mesmo cadastrou.");

    const { data, error } = await supabase
        .from("solicitacoes_adocao")
        .insert({ pet_id: petId, adotante_id: req.usuario.id, respostas: corpo.respostas })
        .select()
        .single();
    if (error && error.code === "23505") throw new ErroHttp(409, "Você já enviou uma solicitação para este pet.");
    verificar({ data, error });

    res.status(201).json(data);
});

// GET /api/adocoes/minhas  -> solicitações que EU enviei
router.get("/minhas", autenticar, exigirTipo("pf"), async (req, res) => {
    const lista = verificar(
        await supabase
            .from("solicitacoes_adocao")
            .select("id, status, observacao, criado_em, atualizado_em, pet:pets(id, nome, foto_url, dono:perfis(nome, telefone, email))")
            .eq("adotante_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(lista);
});

// GET /api/adocoes/recebidas  -> solicitações para os pets que EU cadastrei (PF ou PJ)
// Os dados da validação do adotante (CPF, endereço, experiência) vêm junto:
// assim ele não precisa preencher tudo de novo a cada pedido.
router.get("/recebidas", autenticar, async (req, res) => {
    const lista = verificar(
        await supabase
            .from("solicitacoes_adocao")
            .select(`id, status, observacao, respostas, criado_em, atualizado_em,
                     pet:pets!inner(id, nome, foto_url, dono_id),
                     adotante:perfis(id, nome, email, telefone, cpf, rua, numero, complemento, bairro, cidade, estado, cep,
                                     experiencia_animais, experiencia_descricao, status_validacao)`)
            .eq("pet.dono_id", req.usuario.id)
            .order("criado_em", { ascending: false })
    );
    res.json(lista);
});

// PATCH /api/adocoes/:id/status  { status, observacao }  (só quem cadastrou o pet)
router.patch("/:id/status", autenticar, async (req, res) => {
    const id = v.idNumerico(req.params.id);
    const corpo = req.body || {};
    const status = v.validarOpcao(corpo.status, STATUS, "status");

    const solicitacao = verificar(
        await supabase.from("solicitacoes_adocao").select("id, pet_id, pet:pets(dono_id)").eq("id", id).maybeSingle()
    );
    if (!solicitacao) throw new ErroHttp(404, "Solicitação não encontrada.");
    if (solicitacao.pet.dono_id !== req.usuario.id) throw new ErroHttp(403, "Só quem cadastrou o pet pode responder.");

    const atualizada = verificar(
        await supabase
            .from("solicitacoes_adocao")
            .update({ status, observacao: v.vazioParaNull(corpo.observacao) })
            .eq("id", id)
            .select()
            .single()
    );

    // Adoção aprovada: o pet sai da listagem
    if (status === "aprovada") {
        verificar(await supabase.from("pets").update({ status: "adotado" }).eq("id", solicitacao.pet_id));
    }

    res.json(atualizada);
});

module.exports = router;
