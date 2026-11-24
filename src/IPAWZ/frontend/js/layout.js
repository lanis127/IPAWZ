/* =========================================================
   IPAWZ - HEADER, MENU LATERAL, FOOTER E CONTROLE DE ACESSO
   Todas as telas têm só:

     <body data-pagina="adocao" data-protegida="pf">
       <div id="ipz-header"></div>
       ...conteúdo...
       <div id="ipz-footer"></div>
       <script src="../js/api.js"></script>
       <script src="../js/layout.js"></script>

   e este arquivo monta o resto. Atributos opcionais no <body>:
     data-pagina    -> qual link do topo fica destacado
                       (home | adocao | doacao | voluntarios | perfil)
     data-protegida -> "true" (qualquer conta logada), "pf" ou "pj" (só aquele tipo)

   Regras de acesso (o backend confere tudo de novo; aqui é para a tela):
     - páginas "pf" / "pj" mandam o outro tipo para a home
     - cadastro incompleto (sem tipo de perfil / instituição sem documentos)
       manda para a etapa que falta
     - o menu lateral mostra só o que aquele usuário pode usar
   ========================================================= */

(function () {
    const corpo = document.body;
    const protegida = corpo.dataset.protegida;
    const arquivoAtual = location.pathname.split("/").pop();

    // Telas das etapas do cadastro (não redirecionam para elas mesmas)
    const TELAS_CADASTRO = ["selecao-tipo-usuario.html", "validacao-pf.html", "validacao-instituicao.html", "termos.html"];

    // 1) Páginas protegidas: manda para o login antes de mostrar qualquer coisa
    if (protegida) {
        const sessao = ipawz.exigirLogin(protegida === "true" ? null : protegida);
        if (!sessao) return;
    }

    // 2) Cadastro incompleto: leva para a etapa que falta
    function irParaEtapaPendente(usuario) {
        const etapa = usuario && usuario.proximo_passo;
        if (etapa && etapa !== arquivoAtual && !TELAS_CADASTRO.includes(arquivoAtual)) {
            location.replace(etapa);
            return true;
        }
        return false;
    }

    let sessao = ipawz.obterSessao();
    if (sessao && irParaEtapaPendente(sessao.usuario)) return;

    const logado = Boolean(sessao);
    const usuario = logado ? sessao.usuario : null;
    const tipo = logado ? usuario.tipo : null; // "pf" | "pj"
    const permissoes = (usuario && usuario.permissoes) || {};
    const paginaAtual = corpo.dataset.pagina || "";

    const linksTopo = [
        { id: "home", texto: "Home", href: logado ? "home.html" : "inicio.html" },
        { id: "adocao", texto: "Adoção", href: "listagem.html" },
        { id: "doacao", texto: "Doação", href: "doacao.html" },
        { id: "voluntarios", texto: "Voluntários", href: "vagas-voluntariado.html" }
    ];
    if (logado) {
        linksTopo.push({ id: "perfil", texto: "Perfil", href: tipo === "pj" ? "perfil-pj.html" : "perfil-pf.html" });
    }

    // Menu lateral (ícone ☰): muda conforme o tipo de conta e o perfil escolhido
    function itensDoMenu() {
        if (tipo === "pj") {
            return [
                { texto: "Solicitações recebidas", href: "solicitacoes-adocao.html" },
                { texto: "Administrar vagas", href: "administrar-vagas.html" },
                { texto: "Doações recebidas", href: "doacoes-recebidas.html" },
                { texto: "Chave Pix para doações", href: "chave-pix.html" },
                { texto: "Cadastrar pets para adoção", href: "cadastro-pet.html" },
                { texto: "Meus pets cadastrados", href: "meus-pets.html" },
                { texto: "Documentos da instituição", href: "validacao-instituicao.html" }
            ];
        }
        if (tipo === "pf") {
            const itens = [];
            if (permissoes.adocao) itens.push({ texto: "Minhas solicitações de adoção", href: "acompanhar-adocao.html" });
            if (permissoes.voluntariado) itens.push({ texto: "Acompanhar candidaturas", href: "candidaturas-voluntariado.html" });
            itens.push({ texto: "Histórico de doações", href: "historico-doacoes.html" });
            itens.push({ texto: "Cadastrar pet para adoção", href: "cadastro-pet.html" });
            itens.push({ texto: "Meus pets cadastrados", href: "meus-pets.html" });
            // Quem anuncia o próprio pet também recebe e responde as solicitações dele
            itens.push({ texto: "Solicitações dos meus pets", href: "solicitacoes-adocao.html" });
            if (usuario.precisa_validar && !usuario.validacao_ok) itens.push({ texto: "Validar minha conta", href: "validacao-pf.html" });
            itens.push({ texto: "Alterar tipo de perfil", href: "selecao-tipo-usuario.html" });
            return itens;
        }
        return [];
    }

    const pata = '<img src="../assets/logo/foot-print.png" alt="" aria-hidden="true">';

    function link(item, extraClasse) {
        const ativo = item.id === paginaAtual || item.href === arquivoAtual;
        const classes = [extraClasse, ativo ? "ativo" : ""].filter(Boolean).join(" ");
        return `<a href="${item.href}"${classes ? ` class="${classes}"` : ""}${ativo ? ' aria-current="page"' : ""}>${item.texto}</a>`;
    }

    /* ---------------- HEADER ---------------- */

    function montarHeader() {
        const alvo = document.getElementById("ipz-header");
        if (!alvo) return;

        const botaoMenu = `
            <button class="ipz-btn-menu${logado ? "" : " ipz-so-celular-btn"}" type="button"
                aria-label="Abrir menu" aria-expanded="false" aria-controls="ipz-sidebar">
                <span></span><span></span><span></span>
            </button>`;

        alvo.outerHTML = `
            <header class="ipz-header">
                <a class="ipz-logo" href="${logado ? "home.html" : "inicio.html"}">IPAWZ ${pata}</a>
                <nav class="ipz-nav" aria-label="Menu principal">
                    ${linksTopo.map((item) => link(item)).join("")}
                </nav>
                <div class="ipz-acoes">
                    ${logado ? "" : '<a class="ipz-btn-entrar" href="login.html">Entrar / Cadastrar-se</a>'}
                    ${botaoMenu}
                </div>
            </header>
            <div class="ipz-aviso-conta" id="ipz-aviso-conta" hidden></div>
            <div class="ipz-overlay"></div>
            <aside class="ipz-sidebar" id="ipz-sidebar" aria-label="Menu lateral">
                <ul>
                    ${linksTopo.map((item) => `<li class="ipz-so-celular">${link(item)}</li>`).join("")}
                    ${itensDoMenu().map((item) => `<li>${link(item)}</li>`).join("")}
                    <li>${link({ texto: "Sobre nós", href: "inicio.html#sobre" })}</li>
                    ${logado
                        ? '<li><button type="button" data-ipz-sair>&#x2190; Sair</button></li>'
                        : '<li><a href="login.html">Entrar / Cadastrar-se</a></li>'}
                </ul>
            </aside>`;

        const botao = document.querySelector(".ipz-btn-menu");
        const sidebar = document.querySelector(".ipz-sidebar");
        const overlay = document.querySelector(".ipz-overlay");

        function alternar(abrir) {
            sidebar.classList.toggle("aberto", abrir);
            overlay.classList.toggle("aberto", abrir);
            botao.setAttribute("aria-expanded", String(abrir));
            botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
        }

        botao.addEventListener("click", () => alternar(!sidebar.classList.contains("aberto")));
        overlay.addEventListener("click", () => alternar(false));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") alternar(false);
        });

        const botaoSair = document.querySelector("[data-ipz-sair]");
        if (botaoSair) botaoSair.addEventListener("click", ipawz.sair);
    }

    /* ---------------- AVISO DA VALIDAÇÃO ---------------- */
    // Faixa logo abaixo do header nas áreas logadas (documentos em análise / rejeitados)

    function mostrarAvisoConta(u) {
        const caixa = document.getElementById("ipz-aviso-conta");
        if (!caixa || !u || !protegida || TELAS_CADASTRO.includes(arquivoAtual)) return;

        let texto = "";
        let classe = "";
        if (u.validacao_enviada_em && u.status_validacao === "rejeitado") {
            texto = `Seus documentos foram recusados${u.validacao_observacao ? ": " + ipawz.esc(u.validacao_observacao) : "."} `
                + `<a href="${u.tipo === "pj" ? "validacao-instituicao.html" : "validacao-pf.html"}">Enviar novamente</a>`;
            classe = "erro";
        } else if (u.tipo === "pj" && u.validacao_enviada_em && u.status_validacao === "pendente") {
            texto = "Os documentos da instituição estão em análise pela equipe IPAWZ. Você já pode usar a plataforma normalmente.";
        }
        caixa.innerHTML = texto;
        caixa.className = "ipz-aviso-conta " + classe;
        caixa.hidden = !texto;
    }

    /* ---------------- FOOTER ---------------- */

    const iconeEmail = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" fill="#fff"/><path d="M2 6l10 7 10-7" fill="none" stroke="#EA4335" stroke-width="2.4"/></svg>';
    const iconeTelefone = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#25D366"/><path d="M8.6 6.8c.3-.3.8-.3 1 .1l1 1.9c.2.3.1.7-.1 1l-.7.7c.5 1.2 1.5 2.2 2.7 2.7l.7-.7c.3-.2.7-.3 1-.1l1.9 1c.4.2.4.7.1 1l-1 1c-.6.6-1.6.7-2.4.3-2.4-1.1-4.2-2.9-5.3-5.3-.4-.8-.3-1.8.3-2.4z" fill="#fff"/></svg>';

    function montarFooter() {
        const alvo = document.getElementById("ipz-footer");
        if (!alvo) return;

        alvo.outerHTML = `
            <footer class="ipz-footer">
                <div class="ipz-footer-grid">
                    <div class="ipz-footer-marca">
                        <a class="ipz-logo" href="${logado ? "home.html" : "inicio.html"}">IPAWZ ${pata}</a>
                        <p>Conectando pessoas a causas que transformam vidas animais.</p>
                    </div>
                    <div>
                        <h3>NAVEGAÇÃO</h3>
                        <ul>
                            <li><a href="${logado ? "home.html" : "inicio.html"}">Início</a></li>
                            <li><a href="listagem.html">Adoção</a></li>
                            <li><a href="doacao.html">Doação</a></li>
                            <li><a href="vagas-voluntariado.html">Voluntariado</a></li>
                            <li><a href="doacao.html#instituicoes">Instituições</a></li>
                            <li><a href="inicio.html#sobre">Sobre nós</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>AJUDA</h3>
                        <ul>
                            <li><a href="../assets/docs/TERMOS-E-CONDIÇÕES-IPAWZ.pdf" target="_blank" rel="noopener">Termos de uso</a></li>
                            <li><a href="../assets/docs/POLÍTICA-DE-PRIVACIDADE-IPAWZ.pdf" target="_blank" rel="noopener">Política de privacidade</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>CONTATO</h3>
                        <ul class="ipz-contato">
                            <li>${iconeEmail}<a href="mailto:pets.ipawz@gmail.com">pets.ipawz@gmail.com</a></li>
                            <li>${iconeTelefone}<span>(11) 99999-9999</span></li>
                        </ul>
                    </div>
                </div>
                <div class="ipz-footer-base">
                    <span>Copyright © ${new Date().getFullYear()} IPAWZ - Todos os direitos reservados</span>
                    <button class="ipz-voltar-topo" type="button" aria-label="Voltar ao topo">&#x2191;</button>
                </div>
            </footer>`;

        document.querySelector(".ipz-voltar-topo").addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    montarHeader();
    montarFooter();
    mostrarAvisoConta(usuario);

    // 3) Confere a sessão no servidor (perfil pode ter mudado: validação aprovada, novo tipo...)
    if (logado) {
        ipawz.get("/auth/eu").then((atualizado) => {
            const mudouMenu = JSON.stringify(atualizado.permissoes) !== JSON.stringify(usuario.permissoes)
                || atualizado.validacao_ok !== usuario.validacao_ok;
            ipawz.atualizarUsuario(atualizado);
            if (irParaEtapaPendente(atualizado)) return;
            mostrarAvisoConta(atualizado);
            if (mudouMenu) location.reload();
        }).catch((erro) => {
            if (erro.status === 401) location.replace("login.html");
        });
    }
})();
