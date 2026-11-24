/* =========================================================
   IPAWZ - COMUNICAÇÃO COM O BACKEND
   Todas as telas usam este arquivo para falar com a API.
   Assim o endereço da API, o token de login e o tratamento
   de erros ficam em um lugar só.
   ========================================================= */

(function () {
    // Quando o site é aberto pelo próprio servidor (http://localhost:<PORT do .env>),
    // a API está no mesmo endereço em /api, seja qual for a porta.
    // Se a página for aberta direto do disco (file://) ou pelo Live Server do
    // VS Code (portas 5500-5599), ela chama o backend nesta porta:
    const PORTA_BACKEND = 3000;
    const liveServer = /^55\d\d$/.test(location.port);
    const mesmaOrigem = location.protocol.startsWith("http") && !liveServer;
    const API_URL = window.IPAWZ_API_URL || (mesmaOrigem ? "/api" : `http://localhost:${PORTA_BACKEND}/api`);

    const CHAVE_SESSAO = "ipawz_sessao";

    /* ---------------- Sessão (login) ---------------- */

    function obterSessao() {
        try {
            const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
            if (!sessao || !sessao.token) return null;
            // Token vencido: limpa e trata como deslogado
            if (sessao.expiraEm && Date.now() / 1000 > sessao.expiraEm) {
                localStorage.removeItem(CHAVE_SESSAO);
                return null;
            }
            return sessao;
        } catch (erro) {
            return null;
        }
    }

    function salvarSessao(dados) {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify({
            token: dados.token,
            expiraEm: dados.expiraEm,
            usuario: dados.usuario
        }));
    }

    // Atualiza só os dados do usuário guardados na sessão (depois de editar perfil, validar etc.)
    function atualizarUsuario(usuario) {
        const sessao = obterSessao();
        if (!sessao) return;
        salvarSessao({ ...sessao, usuario });
    }

    function sair() {
        localStorage.removeItem(CHAVE_SESSAO);
        location.href = "inicio.html";
    }

    /* ---------------- Requisições ---------------- */

    async function requisicao(metodo, caminho, corpo) {
        const sessao = obterSessao();
        const opcoes = { method: metodo, headers: {} };

        if (sessao) opcoes.headers.Authorization = "Bearer " + sessao.token;

        if (corpo instanceof FormData) {
            opcoes.body = corpo; // o navegador define o Content-Type sozinho
        } else if (corpo !== undefined) {
            opcoes.headers["Content-Type"] = "application/json";
            opcoes.body = JSON.stringify(corpo);
        }

        let resposta;
        try {
            resposta = await fetch(API_URL + caminho, opcoes);
        } catch (erro) {
            throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando (npm run dev).");
        }

        const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

        if (resposta.status === 401 && sessao) {
            // Sessão expirou no servidor: força novo login
            localStorage.removeItem(CHAVE_SESSAO);
        }

        if (!resposta.ok) {
            const mensagem = (dados && dados.erro) || "Algo deu errado. Tente novamente.";
            const erro = new Error(mensagem);
            erro.status = resposta.status;
            erro.detalhes = dados && dados.detalhes;
            erro.codigo = dados && dados.codigo;
            throw erro;
        }

        return dados;
    }

    /* ---------------- Utilidades de tela ---------------- */

    function aviso(mensagem, tipo) {
        let caixa = document.querySelector(".ipz-aviso");
        if (!caixa) {
            caixa = document.createElement("div");
            caixa.className = "ipz-aviso";
            caixa.setAttribute("role", "status");
            caixa.setAttribute("aria-live", "polite");
            document.body.appendChild(caixa);
        }
        caixa.textContent = mensagem;
        caixa.className = "ipz-aviso visivel " + (tipo || "");
        clearTimeout(caixa._timer);
        caixa._timer = setTimeout(() => caixa.classList.remove("visivel"), 3200);
    }

    // Protege páginas que só funcionam logado. "tipo" opcional: "pf" ou "pj".
    function exigirLogin(tipo) {
        const sessao = obterSessao();
        if (!sessao) {
            const voltar = encodeURIComponent(location.pathname.split("/").pop() + location.search);
            location.replace("login.html?voltar=" + voltar);
            return null;
        }
        if (tipo && sessao.usuario.tipo !== tipo) {
            location.replace("home.html");
            return null;
        }
        return sessao;
    }

    // Pessoa física tentando adotar / ser voluntária sem perfil ou validação.
    // acao: "adocao" | "voluntariado". Devolve true se precisou redirecionar.
    function verificarPermissaoPF(acao, voltar) {
        const sessao = obterSessao();
        if (!sessao || sessao.usuario.tipo !== "pf") return false;
        const u = sessao.usuario;
        const destino = encodeURIComponent(voltar || location.pathname.split("/").pop() + location.search);
        if (!u.permissoes || !u.permissoes[acao]) {
            location.href = `selecao-tipo-usuario.html?precisa=${acao}&voltar=${destino}`;
            return true;
        }
        if (!u.validacao_ok) {
            location.href = `validacao-pf.html?voltar=${destino}`;
            return true;
        }
        return false;
    }

    // Trata erros da API que pedem outra tela (perfil sem permissão / falta validação)
    function tratarBloqueio(erro, acao, voltar) {
        if (erro.codigo === "PERFIL_SEM_PERMISSAO" || erro.codigo === "VALIDACAO_NECESSARIA") {
            const sessao = obterSessao();
            if (sessao && sessao.usuario.tipo === "pj") {
                location.href = "validacao-instituicao.html";
                return true;
            }
            const destino = encodeURIComponent(voltar || location.pathname.split("/").pop() + location.search);
            location.href = erro.codigo === "VALIDACAO_NECESSARIA"
                ? `validacao-pf.html?voltar=${destino}`
                : `selecao-tipo-usuario.html?precisa=${acao}&voltar=${destino}`;
            return true;
        }
        return false;
    }

    // Escapa texto antes de colocar dentro de innerHTML (evita XSS)
    function esc(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function dataBR(valor) {
        if (!valor) return "";
        const texto = String(valor);
        const data = texto.length === 10 ? new Date(texto + "T12:00:00") : new Date(texto);
        return data.toLocaleDateString("pt-BR");
    }

    function parametroUrl(nome) {
        return new URLSearchParams(location.search).get(nome);
    }

    // O que está ligado no servidor (login com Google). Busca uma vez só.
    let configPromessa = null;
    function config() {
        if (!configPromessa) {
            configPromessa = requisicao("GET", "/config").catch(() => ({ loginGoogle: false }));
        }
        return configPromessa;
    }

    // Leva para o login com Google (tipo opcional: "pf" ou "pj", usado no primeiro acesso)
    async function entrarComGoogle(tipo, aoFalhar) {
        const cfg = await config();
        if (!cfg.loginGoogle) {
            aoFalhar("O login com Google ainda não foi ativado neste servidor. Use e-mail e senha.");
            return;
        }
        const voltar = parametroUrl("voltar");
        if (voltar) sessionStorage.setItem("ipawz_voltar", voltar);
        location.href = `${API_URL}/auth/google?origem=${encodeURIComponent(location.origin)}${tipo ? "&tipo=" + tipo : ""}`;
    }

    // Imagem padrão quando o pet ainda não tem foto
    const FOTO_PADRAO = "../assets/img/cao-azul.png";

    window.ipawz = {
        API_URL,
        get: (caminho) => requisicao("GET", caminho),
        post: (caminho, corpo) => requisicao("POST", caminho, corpo),
        put: (caminho, corpo) => requisicao("PUT", caminho, corpo),
        patch: (caminho, corpo) => requisicao("PATCH", caminho, corpo),
        delete: (caminho) => requisicao("DELETE", caminho),
        obterSessao,
        salvarSessao,
        atualizarUsuario,
        sair,
        verificarPermissaoPF,
        tratarBloqueio,
        exigirLogin,
        aviso,
        config,
        entrarComGoogle,
        esc,
        dataBR,
        parametroUrl,
        FOTO_PADRAO
    };
})();
