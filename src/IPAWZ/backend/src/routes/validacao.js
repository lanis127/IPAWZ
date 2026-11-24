/* Validação de contas com envio de documentos.
   - Pessoa física (adotante / voluntário): CPF, endereço, experiência e selfie com documento
   - Instituição: cartão CNPJ, documento + selfie do representante legal e comprovante de endereço
   Os arquivos vão para o bucket PRIVADO "documentos". Ao enviar, status_validacao = "pendente". */
const { Router } = require("express");
const { supabase } = require("../config/supabase");
const { autenticar, exigirTipo } = require("../middlewares/autenticacao");
const { uploadDocumentos, salvarDocumento, ehImagem } = require("../middlewares/upload");
const { ErroHttp, verificar } = require("../utils/erros");
const { perfilParaSite, precisaValidar } = require("../utils/perfil");
const v = require("../utils/validacao");

const router = Router();

// Campos de arquivo da instituição: nome no formulário -> coluna no banco
const ARQUIVOS_PJ = {
    cartaoCnpj: { coluna: "cartao_cnpj_path", nome: "Comprovante de inscrição do CNPJ" },
    documentoRepresentante: { coluna: "documento_representante_path", nome: "Documento com foto do representante" },
    selfieRepresentante: { coluna: "selfie_representante_path", nome: "Selfie do representante com o documento", soImagem: true },
    comprovanteEndereco: { coluna: "comprovante_endereco_path", nome: "Comprovante de endereço" }
};

function lerEndereco(corpo) {
    v.exigirCampos(corpo, ["cep", "rua", "numero", "bairro", "cidade", "estado"]);
    const cep = v.somenteDigitos(corpo.cep);
    if (cep.length !== 8) throw new ErroHttp(400, "CEP inválido.");
    return {
        cep,
        rua: v.texto(corpo.rua),
        numero: v.texto(corpo.numero),
        complemento: v.vazioParaNull(corpo.complemento),
        bairro: v.texto(corpo.bairro),
        cidade: v.texto(corpo.cidade),
        estado: v.texto(corpo.estado).toUpperCase().slice(0, 2)
    };
}

async function salvarPerfil(id, alteracoes) {
    return perfilParaSite(verificar(
        await supabase.from("perfis").update({
            ...alteracoes,
            status_validacao: "pendente",
            validacao_observacao: null,
            validacao_enviada_em: new Date().toISOString()
        }).eq("id", id).select().single(),
        "Não foi possível salvar a validação."
    ));
}

// GET /api/validacao  -> situação da validação de quem está logado
router.get("/", autenticar, (req, res) => {
    const p = perfilParaSite(req.usuario);
    res.json({
        tipo: p.tipo,
        precisaValidar: precisaValidar(req.usuario),
        status: p.status_validacao,
        enviadaEm: p.validacao_enviada_em,
        observacao: p.validacao_observacao,
        documentos: p.documentos
    });
});

// POST /api/validacao/pf  (multipart: campos + arquivo "selfieDocumento")
router.post("/pf", autenticar, exigirTipo("pf"), uploadDocumentos.single("selfieDocumento"), async (req, res) => {
    const corpo = req.body || {};
    v.exigirCampos(corpo, ["cpf", "experienciaAnimais"]);

    const experiencia = v.simNao(corpo.experienciaAnimais);
    const descricao = v.vazioParaNull(corpo.experienciaDescricao);
    if (experiencia && !descricao) throw new ErroHttp(400, "Conte um pouco sobre a sua experiência com animais.");

    // A selfie só pode faltar se já foi enviada antes (reenvio após correção de dados)
    if (!req.file && !req.usuario.selfie_documento_path) {
        throw new ErroHttp(400, "Envie a foto segurando o seu documento.");
    }
    if (req.file && !ehImagem(req.file)) throw new ErroHttp(400, "A selfie com documento precisa ser uma imagem (JPG, PNG ou WEBP).");

    const alteracoes = {
        cpf: v.validarCpf(corpo.cpf),
        ...lerEndereco(corpo),
        experiencia_animais: experiencia,
        experiencia_descricao: experiencia ? descricao : null
    };
    if (req.file) alteracoes.selfie_documento_path = await salvarDocumento(req.file, `pf/${req.usuario.id}`);

    res.json(await salvarPerfil(req.usuario.id, alteracoes));
});

// POST /api/validacao/instituicao  (upload MÚLTIPLO: 4 arquivos + nome e CPF do representante)
router.post("/instituicao", autenticar, exigirTipo("pj"),
    uploadDocumentos.fields(Object.keys(ARQUIVOS_PJ).map((name) => ({ name, maxCount: 1 }))),
    async (req, res) => {
        const corpo = req.body || {};
        v.exigirCampos(corpo, ["representanteNome", "representanteCpf"]);
        const arquivos = req.files || {};

        // Na primeira vez, todos os arquivos são obrigatórios. No reenvio, só os que mudaram.
        const faltando = Object.entries(ARQUIVOS_PJ)
            .filter(([campo, info]) => !arquivos[campo] && !req.usuario[info.coluna])
            .map(([, info]) => info.nome);
        if (faltando.length) throw new ErroHttp(400, `Envie: ${faltando.join(", ")}.`, { faltando });

        const alteracoes = {
            representante_nome: v.texto(corpo.representanteNome),
            representante_cpf: v.validarCpf(corpo.representanteCpf)
        };
        for (const [campo, info] of Object.entries(ARQUIVOS_PJ)) {
            const arquivo = arquivos[campo] && arquivos[campo][0];
            if (!arquivo) continue;
            if (info.soImagem && !ehImagem(arquivo)) throw new ErroHttp(400, `${info.nome}: envie uma imagem (JPG, PNG ou WEBP).`);
            alteracoes[info.coluna] = await salvarDocumento(arquivo, `pj/${req.usuario.id}`);
        }

        res.json(await salvarPerfil(req.usuario.id, alteracoes));
    });

module.exports = router;
