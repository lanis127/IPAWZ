/* Lê o token "Authorization: Bearer <token>" enviado pelo site,
   confere no Supabase e coloca o perfil do usuário em req.usuario.
   Também tem as regras de acesso por tipo de conta. */
const { supabase } = require("../config/supabase");
const { ErroHttp } = require("../utils/erros");
const { pode, validacaoEnviada } = require("../utils/perfil");

async function carregarUsuario(req) {
    const cabecalho = req.headers.authorization || "";
    const [tipo, token] = cabecalho.split(" ");
    if (tipo !== "Bearer" || !token) return null;

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new ErroHttp(401, "Sua sessão expirou. Faça login novamente.");

    const { data: perfil, error: erroPerfil } = await supabase
        .from("perfis").select("*").eq("id", data.user.id).single();
    if (erroPerfil || !perfil) throw new ErroHttp(401, "Perfil não encontrado. Faça o cadastro novamente.");

    return perfil;
}

// Rota exige login
async function autenticar(req, res, next) {
    const usuario = await carregarUsuario(req);
    if (!usuario) throw new ErroHttp(401, "Faça login para continuar.");
    req.usuario = usuario;
    next();
}

// Rota funciona com ou sem login (ex.: doação sem conta)
async function autenticarOpcional(req, res, next) {
    try {
        req.usuario = await carregarUsuario(req);
    } catch (erro) {
        req.usuario = null;
    }
    next();
}

// Use depois de autenticar: exigirTipo("pj") só deixa instituições passarem
function exigirTipo(tipo) {
    return (req, res, next) => {
        if (req.usuario.tipo !== tipo) {
            const quem = tipo === "pj" ? "instituições e ONGs" : "pessoas físicas";
            throw new ErroHttp(403, `Esta área é só para ${quem}.`, undefined, "TIPO_DE_CONTA");
        }
        next();
    };
}

// Pessoa física: o tipo de usuário escolhido precisa permitir a ação ("adocao" | "voluntariado")
function exigirPermissao(acao) {
    const nomes = { adocao: "solicitar adoção", voluntariado: "se candidatar a vagas" };
    return (req, res, next) => {
        if (!pode(req.usuario, acao)) {
            throw new ErroHttp(403,
                `Seu tipo de perfil não permite ${nomes[acao]}. Você pode mudar o perfil quando quiser.`,
                undefined, "PERFIL_SEM_PERMISSAO");
        }
        next();
    };
}

// Documentos de validação precisam ter sido enviados (e não rejeitados)
function exigirValidacao(req, res, next) {
    if (!validacaoEnviada(req.usuario)) {
        const mensagem = req.usuario.tipo === "pj"
            ? "Envie os documentos da instituição para liberar esta ação."
            : "Para adotar ou ser voluntário, complete a validação da sua conta.";
        throw new ErroHttp(403, mensagem, undefined, "VALIDACAO_NECESSARIA");
    }
    next();
}

module.exports = { autenticar, autenticarOpcional, exigirTipo, exigirPermissao, exigirValidacao };
