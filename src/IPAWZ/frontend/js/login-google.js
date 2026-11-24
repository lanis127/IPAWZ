/* =========================================================
   IPAWZ - VOLTA DO LOGIN COM GOOGLE
   O Supabase devolve para esta página com o token no final do endereço:
     login-google.html#access_token=...&expires_at=...
   1. Envia o token ao backend (POST /api/auth/google/sessao)
   2. Já tem cadastro -> entra (e segue para a etapa pendente, se houver)
   3. Primeiro acesso -> mostra "Complete seu cadastro" (PF ou PJ)
      e envia para POST /api/auth/google/completar
   ========================================================= */

(function () {
    const etapaCarregando = document.getElementById("etapa-carregando");
    const mensagemCarregando = document.getElementById("mensagem-carregando");
    const form = document.getElementById("form-completar");
    const mensagemForm = form.querySelector(".mensagem-form");

    // Lê e APAGA o token do endereço (para ele não ficar no histórico do navegador)
    const hash = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    const accessToken = hash.get("access_token");
    const expiraEm = hash.get("expires_at");

    function falhar(texto) {
        mensagemCarregando.textContent = texto;
        document.getElementById("link-tentar").hidden = false;
    }

    function entrar(sessao) {
        ipawz.salvarSessao(sessao);
        const voltar = sessionStorage.getItem("ipawz_voltar");
        sessionStorage.removeItem("ipawz_voltar");
        if (sessao.usuario.proximo_passo) {
            location.replace(sessao.usuario.proximo_passo); // seleção de perfil / documentos
        } else if (voltar && /^[\w-]+\.html(\?.*)?$/.test(voltar)) {
            location.replace(voltar);
        } else {
            location.replace("home.html");
        }
    }

    /* ---------- formulário "Complete seu cadastro" ---------- */

    function trocarTipo(tipo) {
        form.querySelectorAll(".campos-tipo").forEach((grupo) => {
            const ativo = grupo.dataset.tipo === tipo;
            grupo.hidden = !ativo;
            grupo.disabled = !ativo; // campos desativados não vão no envio
        });
    }

    form.querySelectorAll('input[name="tipo"]').forEach((opcao) =>
        opcao.addEventListener("change", () => trocarTipo(opcao.value)));

    const mascaras = {
        cnpj: (d) => d.slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"),
        cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")
    };
    form.querySelectorAll("[data-mascara]").forEach((campo) =>
        campo.addEventListener("input", () => (campo.value = mascaras[campo.dataset.mascara](campo.value.replace(/\D/g, "")))));

    function mostrarFormulario(dados) {
        etapaCarregando.hidden = true;
        form.hidden = false;
        document.getElementById("email-google").textContent = dados.email;
        form.querySelector('[data-tipo="pf"] [name="nome"]').value = dados.nome || "";
        const tipo = ipawz.parametroUrl("tipo") === "pj" ? "pj" : "pf";
        form.querySelector(`input[name="tipo"][value="${tipo}"]`).checked = true;
        trocarTipo(tipo);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        mensagemForm.textContent = "";
        let ok = true;
        form.querySelectorAll("fieldset:not([disabled]) [required]").forEach((campo) => {
            const vazio = !campo.value.trim();
            campo.classList.toggle("campo-invalido", vazio);
            if (vazio) ok = false;
        });
        if (!ok) {
            mensagemForm.textContent = "Preencha os campos destacados.";
            return;
        }

        const dados = Object.fromEntries(new FormData(form).entries());
        const botao = form.querySelector('button[type="submit"]');
        botao.disabled = true;
        try {
            entrar(await ipawz.post("/auth/google/completar", { ...dados, accessToken, expiraEm }));
        } catch (erro) {
            mensagemForm.textContent = erro.message;
            botao.disabled = false;
        }
    });

    /* ---------- início ---------- */

    (async () => {
        if (hash.get("error")) {
            falhar("O login com Google foi cancelado ou não foi autorizado. " + (hash.get("error_description") || ""));
            return;
        }
        if (!accessToken) {
            falhar("Não recebemos o login do Google. Tente de novo.");
            return;
        }
        try {
            const resposta = await ipawz.post("/auth/google/sessao", { accessToken, expiraEm });
            if (resposta.precisaCompletar) mostrarFormulario(resposta);
            else entrar(resposta);
        } catch (erro) {
            falhar(erro.message);
        }
    })();
})();
