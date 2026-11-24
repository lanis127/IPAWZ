/* Pets para adoção: listagem com filtros, detalhes, cadastro e edição. */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, exigirValidacao } = require("../middlewares/autenticacao");
const { upload, salvarImagem } = require("../middlewares/upload");
const { ErroHttp, verificar } = require("../utils/erros");
const v = require("../utils/validacao");

const router = Router();

const OPCOES = {
    especie: ["cachorro", "gato", "passaro", "outro"],
    sexo: ["macho", "femea"],
    faixaEtaria: ["filhote", "jovem", "adulto", "idoso"],
    porte: ["pequeno", "medio", "grande"],
    temperamento: ["calmo", "brincalhao", "agitado", "sociavel", "independente"],
    status: ["disponivel", "inativo", "adotado"]
};

// Dados do responsável que aparecem na tela de detalhes do pet
const DONO_PUBLICO = "dono:perfis(id, tipo, nome, cidade, estado, telefone, email, foto_url, status_validacao)";

function lerPet(corpo, parcial = false) {
    if (!parcial) v.exigirCampos(corpo, ["nome", "especie", "sexo", "idade", "faixaEtaria", "porte"]);
    const pet = {};
    const se = (campo, fn) => { if (corpo[campo] !== undefined && corpo[campo] !== "") pet[fn[0]] = fn[1](corpo[campo]); };

    se("nome", ["nome", v.texto]);
    se("especie", ["especie", (x) => v.validarOpcao(x, OPCOES.especie, "espécie")]);
    se("sexo", ["sexo", (x) => v.validarOpcao(x, OPCOES.sexo, "sexo")]);
    se("idade", ["idade", v.texto]);
    se("faixaEtaria", ["faixa_etaria", (x) => v.validarOpcao(x, OPCOES.faixaEtaria, "faixa etária")]);
    se("porte", ["porte", (x) => v.validarOpcao(x, OPCOES.porte, "porte")]);
    se("temperamento", ["temperamento", (x) => v.validarOpcao(x, OPCOES.temperamento, "temperamento")]);
    se("vacinado", ["vacinado", v.simNao]);
    se("castrado", ["castrado", v.simNao]);
    se("sociavelPets", ["sociavel_pets", v.simNao]);
    se("sociavelPessoas", ["sociavel_pessoas", v.simNao]);
    if (corpo.doenca !== undefined) pet.doenca = v.vazioParaNull(corpo.doenca);
    if (corpo.descricao !== undefined) pet.descricao = v.vazioParaNull(corpo.descricao);
    se("cidade", ["cidade", v.texto]);
    se("uf", ["uf", (x) => v.texto(x).toUpperCase().slice(0, 2)]);
    return pet;
}

async function buscarPetDoUsuario(id, usuario) {
    const pet = verificar(await supabase.from("pets").select("*").eq("id", id).maybeSingle());
    if (!pet) throw new ErroHttp(404, "Pet não encontrado.");
    if (pet.dono_id !== usuario.id) throw new ErroHttp(403, "Você só pode alterar os pets que cadastrou.");
    return pet;
}

// GET /api/pets?especie=gato&porte=medio&pagina=1&limite=9
router.get("/", async (req, res) => {
    const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
    const limite = Math.min(50, Math.max(1, parseInt(req.query.limite, 10) || 9));
    const inicio = (pagina - 1) * limite;

    let consulta = supabase
        .from("pets")
        .select("id, nome, especie, sexo, idade, faixa_etaria, porte, temperamento, cidade, uf, foto_url", { count: "exact" })
        .eq("status", "disponivel");

    const filtros = { especie: "especie", sexo: "sexo", faixaEtaria: "faixa_etaria", porte: "porte", temperamento: "temperamento" };
    for (const [param, coluna] of Object.entries(filtros)) {
        const valor = req.query[param];
        if (valor && valor !== "indiferente") consulta = consulta.eq(coluna, v.validarOpcao(valor, OPCOES[param], param));
    }
    if (req.query.busca) consulta = consulta.ilike("nome", `%${v.texto(req.query.busca)}%`);

    const { data, count } = verificar.comContagem(
        await consulta.order("criado_em", { ascending: false }).range(inicio, inicio + limite - 1)
    );

    res.json({ itens: data, total: count, pagina, totalPaginas: Math.max(1, Math.ceil(count / limite)) });
});

// GET /api/pets/meus  (precisa vir antes de "/:id")
router.get("/meus", autenticar, async (req, res) => {
    const pets = verificar(
        await supabase.from("pets").select("*").eq("dono_id", req.usuario.id).order("criado_em", { ascending: false })
    );
    res.json(pets);
});

// GET /api/pets/:id
router.get("/:id", async (req, res) => {
    const pet = verificar(
        await supabase.from("pets").select(`*, ${DONO_PUBLICO}`).eq("id", v.idNumerico(req.params.id)).maybeSingle()
    );
    if (!pet) throw new ErroHttp(404, "Pet não encontrado.");
    res.json(pet);
});

// Instituições só anunciam pets depois de enviar os documentos de validação
const instituicaoValidada = (req, res, next) => (req.usuario.tipo === "pj" ? exigirValidacao(req, res, next) : next());

// POST /api/pets  (multipart/form-data, com a foto no campo "foto")
router.post("/", autenticar, instituicaoValidada, upload.single("foto"), async (req, res) => {
    const pet = lerPet(req.body || {});
    pet.dono_id = req.usuario.id;
    pet.cidade = pet.cidade || req.usuario.cidade;
    pet.uf = pet.uf || req.usuario.estado;
    pet.foto_url = await salvarImagem(req.file, `pets/${req.usuario.id}`);

    const criado = verificar(await supabase.from("pets").insert(pet).select().single(), "Não foi possível cadastrar o pet.");
    res.status(201).json(criado);
});

// PUT /api/pets/:id  (pode mandar foto nova)
router.put("/:id", autenticar, upload.single("foto"), async (req, res) => {
    const id = v.idNumerico(req.params.id);
    await buscarPetDoUsuario(id, req.usuario);

    const alteracoes = lerPet(req.body || {}, true);
    if (req.file) alteracoes.foto_url = await salvarImagem(req.file, `pets/${req.usuario.id}`);

    const pet = verificar(await supabase.from("pets").update(alteracoes).eq("id", id).select().single());
    res.json(pet);
});

// PATCH /api/pets/:id/status  { status: "disponivel" | "inativo" | "adotado" }
router.patch("/:id/status", autenticar, async (req, res) => {
    const id = v.idNumerico(req.params.id);
    await buscarPetDoUsuario(id, req.usuario);
    const status = v.validarOpcao((req.body || {}).status, OPCOES.status, "status");

    const pet = verificar(await supabase.from("pets").update({ status }).eq("id", id).select().single());
    res.json(pet);
});

// DELETE /api/pets/:id
router.delete("/:id", autenticar, async (req, res) => {
    const id = v.idNumerico(req.params.id);
    await buscarPetDoUsuario(id, req.usuario);
    verificar(await supabase.from("pets").delete().eq("id", id));
    res.status(204).end();
});

module.exports = router;
