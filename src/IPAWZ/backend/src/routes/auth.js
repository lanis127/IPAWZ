/* Cadastro, login (e-mail/senha ou Google) e recuperação de senha.
   E-mail e senha ficam no Supabase Auth; o resto do cadastro vai para "perfis".

   Fluxo do cadastro em etapas:
     PF: cadastro -> selecao-tipo-usuario.html -> (adotante/voluntário) validacao-pf.html
     PJ: cadastro -> validacao-instituicao.html (obrigatório) */
const crypto = require("crypto");
const { Router } = require("express");
const { supabase, clientePublico } = require("../config/supabase");
const { autenticar } = require("../middlewares/autenticacao");
const { ErroHttp, erroDoBanco, verificar } = require("../utils/erros");
const { perfilParaSite } = require("../utils/perfil");
const { enviarCodigoSenha } = require("../services/email");
const v = require("../utils/validacao");

const router = Router();

const MINUTOS_CODIGO = 15;
const MAX_TENTATIVAS = 5;
const ESPERA_REENVIO_SEGUNDOS = 60;

// Monta o perfil a partir do corpo da requisição, conforme o tipo de conta
function dadosDoPerfil(corpo, tipo) {
    if (tipo === "pf") {
        v.exigirCampos(corpo, ["nome", "dataNascimento", "telefone", "estado"]);
        return {
            nome: v.texto(corpo.nome),
            data_nascimento: corpo.dataNascimento,
            telefone: v.texto(corpo.telefone),
            estado: v.texto(corpo.estado).toUpperCase().slice(0, 2)
            // o tipo de usuário é escolhido na próxima tela (selecao-tipo-usuario.html)
        };
    }

    v.exigirCampos(corpo, ["razaoSocial", "nomeFantasia", "cnpj", "telefone", "rua", "numero", "bairro", "cidade", "estado", "cep", "tipoInstituicao"]);
    return {
        nome: v.texto(corpo.nomeFantasia),
        razao_social: v.texto(corpo.razaoSocial),
        cnpj: v.validarCnpj(corpo.cnpj),
        telefone: v.texto(corpo.telefone),
        rua: v.texto(corpo.rua),
        numero: v.texto(corpo.numero),
        bairro: v.texto(corpo.bairro),
        cidade: v.texto(corpo.cidade),
        estado: v.texto(corpo.estado).toUpperCase().slice(0, 2),
        cep: v.somenteDigitos(corpo.cep),
        tipo_instituicao: v.texto(corpo.tipoInstituicao),
        status_validacao: "pendente" // documentos são enviados na próxima tela
    };
}

function respostaDeSessao(sessao, perfil) {
    return {
        token: sessao.access_token,
        expiraEm: sessao.expires_at,
        usuario: perfilParaSite(perfil)
    };
}

// POST /api/auth/cadastro
router.post("/cadastro", async (req, res) => {
    const corpo = req.body || {};
    const tipo = v.validarOpcao(corpo.tipo, ["pf", "pj"], "tipo de conta");
    const email = v.validarEmail(corpo.email);
    const senha = v.validarSenha(corpo.senha);
    if (corpo.confirmarSenha !== undefined && corpo.confirmarSenha !== corpo.senha) {
        throw new ErroHttp(400, "As senhas não conferem.");
    }
    const perfil = dadosDoPerfil(corpo, tipo);

    // 1) cria o usuário no Supabase Auth (já confirmado, para o projeto funcionar sem servidor de e-mail)
    const { data: criado, error: erroAuth } = await supabase.auth.admin.createUser({
        email, password: senha, email_confirm: true
    });
    if (erroAuth) {
        if (/already|registered|exists/i.test(erroAuth.message)) throw new ErroHttp(409, "Este e-mail já está cadastrado.");
        throw new ErroHttp(400, "Não foi possível criar a conta: " + erroAuth.message);
    }

    // 2) cria o perfil. Se falhar (ex.: CNPJ repetido), apaga o usuário para não ficar "meio cadastrado"
    const { data: perfilCriado, error: erroPerfil } = await supabase
        .from("perfis")
        .insert({ id: criado.user.id, tipo, email, ...perfil })
        .select()
        .single();
    if (erroPerfil) {
        await supabase.auth.admin.deleteUser(criado.user.id);
        throw erroDoBanco(erroPerfil, "Não foi possível salvar o cadastro.");
    }

    // 3) já devolve logado (o site usa usuario.proximo_passo para saber a próxima tela)
    const { data: login, error: erroLogin } = await clientePublico().auth.signInWithPassword({ email, password: senha });
    if (erroLogin) throw new ErroHttp(500, "Conta criada, mas não foi possível entrar. Tente fazer login.");

    res.status(201).json(respostaDeSessao(login.session, perfilCriado));
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const corpo = req.body || {};
    v.exigirCampos(corpo, ["email", "senha"]);

    const { data, error } = await clientePublico().auth.signInWithPassword({
        email: v.texto(corpo.email).toLowerCase(),
        password: String(corpo.senha)
    });
    if (error) throw new ErroHttp(401, "E-mail ou senha incorretos.");

    const { data: perfil } = await supabase.from("perfis").select("*").eq("id", data.user.id).single();
    if (!perfil) throw new ErroHttp(404, "Cadastro incompleto. Crie sua conta novamente.");

    res.json(respostaDeSessao(data.session, perfil));
});

/* ---------------- ENTRAR COM GOOGLE ----------------
   1. GET /api/auth/google        -> manda a pessoa para o login do Google (via Supabase)
   2. O Google/Supabase devolve para html/login-google.html#access_token=...
   3. POST /api/auth/google/sessao    -> se já tem perfil, entra
   4. POST /api/auth/google/completar -> primeiro acesso: cria o perfil (PF ou PJ)
   Depois disso o fluxo é o mesmo do cadastro normal (seleção de perfil / documentos). */

const googleAtivo = () => process.env.GOOGLE_LOGIN_ATIVO === "true";

// Só devolve para endereços conhecidos do próprio site (evita redirecionar para sites estranhos)
function origemPermitida(origem) {
    const permitidas = [process.env.SITE_URL || "http://localhost:3000", ...(process.env.CORS_ORIGENS || "").split(",")]
        .map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
    return permitidas.includes(origem) ? origem : permitidas[0];
}

// GET /api/auth/google?origem=http://localhost:3000&tipo=pj
router.get("/google", (req, res) => {
    const origem = origemPermitida(String(req.query.origem || ""));
    if (!googleAtivo()) return res.redirect(`${origem}/html/login.html?erro=google-desativado`);

    const volta = new URL(`${origem}/html/login-google.html`);
    if (req.query.tipo === "pf" || req.query.tipo === "pj") volta.searchParams.set("tipo", req.query.tipo);

    const destino = new URL(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/authorize`);
    destino.searchParams.set("provider", "google");
    destino.searchParams.set("redirect_to", volta.toString());
    res.redirect(destino.toString());
});

async function usuarioDoGoogle(corpo) {
    v.exigirCampos(corpo, ["accessToken"]);
    const { data, error } = await supabase.auth.getUser(String(corpo.accessToken));
    if (error || !data.user) throw new ErroHttp(401, "Não foi possível confirmar o login com o Google. Tente de novo.");
    const expira = Number(corpo.expiraEm);
    const sessao = {
        access_token: String(corpo.accessToken),
        expires_at: Number.isFinite(expira) && expira > Date.now() / 1000 ? expira : Math.floor(Date.now() / 1000) + 3600
    };
    return { usuario: data.user, sessao };
}

// POST /api/auth/google/sessao  { accessToken, expiraEm }
router.post("/google/sessao", async (req, res) => {
    const { usuario, sessao } = await usuarioDoGoogle(req.body || {});
    const { data: perfil } = await supabase.from("perfis").select("*").eq("id", usuario.id).maybeSingle();
    if (perfil) return res.json(respostaDeSessao(sessao, perfil));

    // Primeiro acesso: o site mostra o formulário "Complete seu cadastro"
    const meta = usuario.user_metadata || {};
    res.json({ precisaCompletar: true, email: usuario.email, nome: meta.full_name || meta.name || "" });
});

// POST /api/auth/google/completar  { accessToken, expiraEm, tipo, ...campos do cadastro }
router.post("/google/completar", async (req, res) => {
    const corpo = req.body || {};
    const { usuario, sessao } = await usuarioDoGoogle(corpo);
    const tipo = v.validarOpcao(corpo.tipo, ["pf", "pj"], "tipo de conta");

    const { data: existe } = await supabase.from("perfis").select("id").eq("id", usuario.id).maybeSingle();
    if (existe) throw new ErroHttp(409, "Esta conta já está cadastrada. Faça login.");

    const meta = usuario.user_metadata || {};
    const perfil = verificar(await supabase.from("perfis").insert({
        id: usuario.id,
        tipo,
        email: String(usuario.email).toLowerCase(),
        foto_url: meta.avatar_url || meta.picture || null,
        ...dadosDoPerfil(corpo, tipo)
    }).select().single(), "Não foi possível salvar o cadastro.");

    res.status(201).json(respostaDeSessao(sessao, perfil));
});

// GET /api/auth/eu  -> dados de quem está logado (o site atualiza a sessão com isso)
router.get("/eu", autenticar, (req, res) => {
    res.json(perfilParaSite(req.usuario));
});

/* ---------------- RECUPERAÇÃO DE SENHA ----------------
   O backend gera um código de 6 dígitos, guarda só o hash na tabela
   "codigos_senha" (vale 15 min, até 5 tentativas) e envia por e-mail. */

const hashCodigo = (usuarioId, codigo) =>
    crypto.createHash("sha256").update(`${usuarioId}:${codigo}`).digest("hex");

const RESPOSTA_GENERICA = { mensagem: "Se existir uma conta com este e-mail, você receberá um código para redefinir a senha." };

// POST /api/auth/recuperar-senha  { email }
router.post("/recuperar-senha", async (req, res) => {
    const email = v.validarEmail((req.body || {}).email);

    const perfil = verificar(await supabase.from("perfis").select("id, nome, email").eq("email", email).maybeSingle());
    // Mesma resposta exista ou não a conta (não revela quais e-mails são cadastrados)
    if (!perfil) return res.json(RESPOSTA_GENERICA);

    // Evita pedidos repetidos em sequência
    const ultimo = verificar(await supabase.from("codigos_senha").select("criado_em")
        .eq("usuario_id", perfil.id).order("criado_em", { ascending: false }).range(0, 0));
    if (ultimo.length && Date.now() - new Date(ultimo[0].criado_em).getTime() < ESPERA_REENVIO_SEGUNDOS * 1000) {
        throw new ErroHttp(429, `Aguarde ${ESPERA_REENVIO_SEGUNDOS} segundos antes de pedir um novo código.`);
    }

    const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    verificar(await supabase.from("codigos_senha").insert({
        usuario_id: perfil.id,
        codigo_hash: hashCodigo(perfil.id, codigo),
        expira_em: new Date(Date.now() + MINUTOS_CODIGO * 60 * 1000).toISOString()
    }));

    try {
        await enviarCodigoSenha({ para: perfil.email, nome: perfil.nome, codigo, minutos: MINUTOS_CODIGO });
    } catch (erro) {
        console.error("[E-mail] Falha ao enviar código:", erro.message);
        throw new ErroHttp(502, "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.");
    }

    res.json(RESPOSTA_GENERICA);
});

// POST /api/auth/redefinir-senha  { email, codigo, novaSenha }
router.post("/redefinir-senha", async (req, res) => {
    const corpo = req.body || {};
    v.exigirCampos(corpo, ["email", "codigo", "novaSenha"]);
    const email = v.validarEmail(corpo.email);
    const novaSenha = v.validarSenha(corpo.novaSenha);
    const codigo = v.somenteDigitos(corpo.codigo);
    const invalido = new ErroHttp(400, "Código inválido ou expirado. Peça um novo código.");

    const perfil = verificar(await supabase.from("perfis").select("id").eq("email", email).maybeSingle());
    if (!perfil) throw invalido;

    const [registro] = verificar(await supabase.from("codigos_senha").select("*")
        .eq("usuario_id", perfil.id).order("criado_em", { ascending: false }).range(0, 0));
    if (!registro || registro.usado_em || new Date(registro.expira_em) < new Date()) throw invalido;
    if (registro.tentativas >= MAX_TENTATIVAS) {
        throw new ErroHttp(429, "Muitas tentativas erradas. Peça um novo código.");
    }

    const esperado = Buffer.from(registro.codigo_hash, "hex");
    const recebido = Buffer.from(hashCodigo(perfil.id, codigo), "hex");
    if (codigo.length !== 6 || !crypto.timingSafeEqual(esperado, recebido)) {
        verificar(await supabase.from("codigos_senha").update({ tentativas: registro.tentativas + 1 }).eq("id", registro.id));
        throw invalido;
    }

    const { error: erroSenha } = await supabase.auth.admin.updateUserById(perfil.id, { password: novaSenha });
    if (erroSenha) throw new ErroHttp(500, "Não foi possível alterar a senha.");
    verificar(await supabase.from("codigos_senha").update({ usado_em: new Date().toISOString() }).eq("id", registro.id));

    res.json({ mensagem: "Senha alterada! Faça login com a nova senha." });
});

module.exports = router;
