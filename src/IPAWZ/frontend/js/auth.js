/* =========================================================
   IPAWZ - LOGIN, CADASTRO E RECUPERAÇÃO DE SENHA
   Um arquivo só para as 6 telas de acesso. Cada bloco só roda
   se o formulário dele existir na página aberta.
   ========================================================= */

(function () {
    /* ---------- utilidades ---------- */

    function dadosDoFormulario(form) {
        return Object.fromEntries(new FormData(form).entries());
    }

    function mostrarMensagem(form, texto, sucesso) {
        const caixa = form.querySelector(".mensagem-form");
        if (!caixa) return;
        caixa.textContent = texto || "";
        caixa.classList.toggle("sucesso", Boolean(sucesso));
    }

    // Confere campos obrigatórios e destaca os que estão vazios
    function validarObrigatorios(form) {
        let valido = true;
        form.querySelectorAll("[required]").forEach((campo) => {
            const ok = campo.value.trim() !== "" && campo.checkValidity();
            campo.classList.toggle("campo-invalido", !ok);
            if (!ok) valido = false;
        });
        return valido;
    }

    async function enviar(form, acao) {
        const botao = form.querySelector('button[type="submit"]');
        mostrarMensagem(form, "");
        if (!validarObrigatorios(form)) {
            mostrarMensagem(form, "Preencha os campos destacados corretamente.");
            return;
        }
        botao.disabled = true;
        try {
            await acao(dadosDoFormulario(form));
        } catch (erro) {
            mostrarMensagem(form, erro.message);
        } finally {
            botao.disabled = false;
        }
    }

    function irDepoisDoLogin(usuario) {
        // Cadastro incompleto? Vai para a etapa que falta (tipo de perfil / documentos)
        if (usuario && usuario.proximo_passo) {
            location.href = usuario.proximo_passo;
            return;
        }
        const voltar = ipawz.parametroUrl("voltar");
        // só aceita voltar para páginas do próprio site
        if (voltar && /^[\w-]+\.html(\?.*)?$/.test(voltar)) {
            location.href = voltar;
        } else {
            location.href = "home.html";
        }
    }

    /* ---------- mostrar / esconder senha ---------- */
    document.querySelectorAll(".ver-senha").forEach((botao) => {
        botao.addEventListener("click", () => {
            const campo = botao.previousElementSibling;
            const mostrar = campo.type === "password";
            campo.type = mostrar ? "text" : "password";
            botao.setAttribute("aria-pressed", String(mostrar));
            botao.setAttribute("aria-label", mostrar ? "Esconder senha" : "Mostrar senha");
        });
    });

    /* ---------- máscaras simples (CNPJ e CEP) ---------- */
    const mascaras = {
        cnpj: (d) => d.slice(0, 14)
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2"),
        cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")
    };
    document.querySelectorAll("[data-mascara]").forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = mascaras[campo.dataset.mascara](campo.value.replace(/\D/g, ""));
        });
    });

    /* ---------- se já estiver logado, não precisa ver login/cadastro ---------- */
    if (ipawz.obterSessao() && document.getElementById("form-login")) {
        irDepoisDoLogin(ipawz.obterSessao().usuario);
        return;
    }

    /* ---------- LOGIN ---------- */
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            enviar(formLogin, async (dados) => {
                const sessao = await ipawz.post("/auth/login", dados);
                ipawz.salvarSessao(sessao);
                irDepoisDoLogin(sessao.usuario);
            });
        });

        if (ipawz.parametroUrl("erro") === "google-desativado") {
            mostrarMensagem(formLogin, "O login com Google ainda não foi ativado neste servidor. Use e-mail e senha.");
        }
    }

    /* ---------- ENTRAR COM GOOGLE (login e cadastros) ---------- */
    const botaoGoogle = document.getElementById("login-google");
    if (botaoGoogle) {
        const form = document.querySelector("form");
        botaoGoogle.addEventListener("click", () => {
            // na tela de cadastro PJ o Google já começa como instituição
            ipawz.entrarComGoogle(botaoGoogle.dataset.tipo || null, (texto) => mostrarMensagem(form, texto));
        });
    }

    /* ---------- ESCOLHA PF / PJ ---------- */
    document.querySelectorAll('input[name="tipo_pessoa"]').forEach((opcao) => {
        opcao.addEventListener("change", () => {
            location.href = opcao.value === "pj" ? "cadastro-pj.html" : "cadastro-pf.html";
        });
    });

    /* ---------- CADASTRO (PF e PJ) ---------- */
    const formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", (e) => {
            e.preventDefault();
            enviar(formCadastro, async (dados) => {
                if (dados.senha !== dados.confirmarSenha) throw new Error("As senhas não conferem.");
                dados.tipo = formCadastro.dataset.tipo;
                const sessao = await ipawz.post("/auth/cadastro", dados);
                ipawz.salvarSessao(sessao);
                // PF -> seleção de perfil | PJ -> validação da instituição
                location.href = sessao.usuario.proximo_passo || "home.html";
            });
        });
    }

    /* ---------- RECUPERAR SENHA (envia o código) ---------- */
    const formRecuperar = document.getElementById("form-recuperar");
    if (formRecuperar) {
        if (ipawz.parametroUrl("email")) formRecuperar.email.value = ipawz.parametroUrl("email");
        formRecuperar.addEventListener("submit", (e) => {
            e.preventDefault();
            enviar(formRecuperar, async (dados) => {
                await ipawz.post("/auth/recuperar-senha", dados);
                location.href = "redefinir-senha.html?email=" + encodeURIComponent(dados.email);
            });
        });
    }

    /* ---------- REDEFINIR SENHA (código + nova senha) ---------- */
    const formRedefinir = document.getElementById("form-redefinir");
    if (formRedefinir) {
        const email = ipawz.parametroUrl("email");
        if (email) {
            formRedefinir.email.value = email;
            document.getElementById("link-reenviar").href = "recuperar-senha.html?email=" + encodeURIComponent(email);
        }

        formRedefinir.addEventListener("submit", (e) => {
            e.preventDefault();
            enviar(formRedefinir, async (dados) => {
                if (dados.novaSenha !== dados.confirmarSenha) throw new Error("As senhas não conferem.");
                const resposta = await ipawz.post("/auth/redefinir-senha", dados);
                mostrarMensagem(formRedefinir, resposta.mensagem, true);
                setTimeout(() => (location.href = "login.html"), 1800);
            });
        });
    }
})();
