/* =========================================================
   IPAWZ - DETALHES DA VAGA DE VOLUNTARIADO
   Abre com detalhes-vaga-voluntariado.html?id=<id da vaga>
   Candidatura: POST /api/vagas/:id/candidaturas
   ========================================================= */

const idVaga = ipawz.parametroUrl("id");
const botao = document.getElementById("btn-candidatar");
const mensagem = document.getElementById("mensagem-candidatura");
const rotuloMensagem = document.getElementById("rotulo-mensagem");

function mostrar(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
}

function preencher(vaga) {
    const titulo = vaga.tipo_servico === "outro" ? vaga.tipo_outro : vaga.tipo_servico;
    document.title = `${titulo} | IPAWZ`;
    document.getElementById("titulo-vaga").textContent = titulo.toUpperCase();
    document.getElementById("tipo-vaga").textContent = titulo;
    document.getElementById("localizacao-vaga").innerHTML =
        `<span class="location-icon" aria-hidden="true">⌖</span> ${ipawz.esc(vaga.local)}`;
    document.getElementById("data-vaga").textContent = ipawz.dataBR(vaga.data);
    document.getElementById("instituicao-vaga").textContent = vaga.instituicao ? vaga.instituicao.nome : "";

    const imagem = document.getElementById("imagem-vaga");
    if (vaga.imagem_url) imagem.src = vaga.imagem_url;
    imagem.alt = `Local da vaga: ${titulo}`;

    // Cada linha da descrição vira um parágrafo
    const descricao = document.getElementById("descricao-vaga");
    descricao.replaceChildren(...vaga.descricao.split(/\n+/).filter(Boolean).map((texto) => {
        const p = document.createElement("p");
        p.textContent = texto;
        return p;
    }));
}

function configurarBotao(vaga) {
    const sessao = ipawz.obterSessao();

    if (!vaga.ativa) {
        botao.disabled = true;
        mostrar("Esta vaga não está mais recebendo candidaturas.");
        return;
    }
    if (!sessao) {
        botao.textContent = "Entre para se candidatar";
        botao.addEventListener("click", () => {
            location.href = "login.html?voltar=" + encodeURIComponent(`detalhes-vaga-voluntariado.html?id=${idVaga}`);
        });
        return;
    }
    if (sessao.usuario.tipo === "pj") {
        botao.disabled = true;
        mostrar("Candidaturas são feitas por pessoas físicas.");
        return;
    }

    // Perfil sem voluntariado ou sem validação: o botão leva para a etapa que falta
    const u = sessao.usuario;
    if (!u.permissoes || !u.permissoes.voluntariado || !u.validacao_ok) {
        botao.textContent = !u.permissoes || !u.permissoes.voluntariado ? "Ativar perfil voluntário" : "Validar conta para se candidatar";
        botao.addEventListener("click", () => ipawz.verificarPermissaoPF("voluntariado"));
        return;
    }

    rotuloMensagem.hidden = false;
    botao.addEventListener("click", async () => {
        botao.disabled = true;
        try {
            await ipawz.post(`/vagas/${encodeURIComponent(idVaga)}/candidaturas`, {
                mensagem: document.getElementById("mensagem-voluntario").value
            });
            rotuloMensagem.hidden = true;
            botao.textContent = "Candidatura enviada ✓";
            mostrar("Pronto! Abrindo suas candidaturas...");
            setTimeout(() => (location.href = "candidaturas-voluntariado.html"), 1200);
        } catch (erro) {
            if (ipawz.tratarBloqueio(erro, "voluntariado")) return;
            mostrar(erro.message);
            botao.disabled = erro.status === 409; // já candidatado: mantém desativado
        }
    });
}

(async () => {
    if (!idVaga) {
        location.replace("vagas-voluntariado.html");
        return;
    }
    try {
        const vaga = await ipawz.get("/vagas/" + encodeURIComponent(idVaga));
        preencher(vaga);
        configurarBotao(vaga);
    } catch (erro) {
        document.getElementById("titulo-vaga").textContent = "Vaga não encontrada";
        botao.disabled = true;
        mostrar(erro.message);
    }
})();
