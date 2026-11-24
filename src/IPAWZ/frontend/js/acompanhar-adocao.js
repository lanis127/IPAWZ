/* =========================================================
   IPAWZ - MINHAS SOLICITAÇÕES DE ADOÇÃO (pessoa física)
   GET /api/adocoes/minhas
   ========================================================= */

const lista = document.getElementById("listaSolicitacoes");
const filtroStatus = document.getElementById("filtroStatus");
const filtros = document.getElementById("filtros");
const botaoFiltro = document.getElementById("botaoFiltro");
const fundoModal = document.getElementById("fundoModal");

const ETAPAS = [
    { status: "enviada", titulo: ["Solicitação", "Enviada"], texto: "Pedido encaminhado à instituição." },
    { status: "recebida", titulo: ["Solicitação", "Recebida"], texto: "A instituição recebeu o pedido." },
    { status: "analise", titulo: ["Formulário", "em Análise"], texto: "Os dados estão sendo analisados." },
    { status: "aprovada", titulo: ["Adoção", "Aprovada!"], texto: "A solicitação foi aprovada." }
];
const NOME_STATUS = {
    enviada: "Solicitação enviada", recebida: "Solicitação recebida", analise: "Formulário em análise",
    aprovada: "Adoção aprovada", recusada: "Não aprovada"
};

let solicitacoes = [];
const novaSolicitacao = ipawz.parametroUrl("nova"); // vem do formulário de adoção

function linhaDoTempo(s) {
    const recusada = s.status === "recusada";
    // recusada: mostra a última etapa como "Não aprovada"
    const atual = recusada ? 3 : ETAPAS.findIndex((e) => e.status === s.status);
    const etapas = ETAPAS.map((e, i) => (recusada && i === 3)
        ? { ...e, titulo: ["Adoção", "Não aprovada"], texto: "A instituição não aprovou este pedido." }
        : e);

    const pontos = etapas.map((e, i) => {
        let classe = "etapa-ponto";
        let simbolo = "";
        if (i === 3 && i <= atual) {
            classe += recusada ? " recusado" : " aprovado";
            simbolo = recusada ? "×" : "✓";
        } else if (i > atual) {
            classe += " pendente";
        }
        return `<button class="${classe}" data-etapa="${i}" type="button" aria-label="${e.titulo.join(" ")}">${simbolo}</button>`;
    }).join("");

    const textos = etapas.map((e, i) => `
        <button class="etapa${i === atual ? " selecionada" : ""}${i > atual ? " futura" : ""}" data-etapa="${i}" type="button">
            <strong>${e.titulo[0]}</strong><strong>${e.titulo[1]}</strong>
            <small>${e.texto}</small>
        </button>`).join("");

    return `<div class="progresso"><div class="linha-progresso">${pontos}</div><div class="etapas-texto">${textos}</div></div>`;
}

function cartao(s) {
    const pet = s.pet || {};
    const instituicao = pet.dono ? pet.dono.nome : "";
    return `
        <section class="cartao-solicitacao${String(s.id) === novaSolicitacao ? " nova" : ""}" data-id="${s.id}" id="solicitacao-${s.id}">
            <div class="informacoes">
                <p>Data Solicitação: ${ipawz.dataBR(s.criado_em)}</p>
                <p>Pet: ${ipawz.esc(pet.nome || "-")}</p>
                <p>Instituição: ${ipawz.esc(instituicao)}</p>
            </div>
            <div class="detalhes-container">
                <button class="botao-detalhes" type="button" data-detalhes="${s.id}">VER DETALHES</button>
            </div>
            ${linhaDoTempo(s)}
        </section>`;
}

function render() {
    const status = filtroStatus.value;
    const visiveis = solicitacoes.filter((s) => status === "todos" || s.status === status);
    if (!solicitacoes.length) {
        lista.innerHTML = '<p class="ipz-estado">Você ainda não enviou nenhuma solicitação. <a href="listagem.html">Conheça os pets</a></p>';
    } else {
        lista.innerHTML = visiveis.length
            ? visiveis.map(cartao).join("")
            : '<p class="ipz-estado">Nenhuma solicitação corresponde ao filtro selecionado.</p>';
    }
}

/* ---------- detalhes (modal) ---------- */
function abrirDetalhes(id) {
    const s = solicitacoes.find((x) => x.id === Number(id));
    if (!s) return;
    const pet = s.pet || {};
    const dono = pet.dono || {};
    const contato = s.status === "aprovada" && (dono.telefone || dono.email)
        ? `<p><strong>Contato:</strong> ${ipawz.esc([dono.telefone, dono.email].filter(Boolean).join(" • "))}</p>` : "";
    document.getElementById("conteudoModal").innerHTML = `
        <p><strong>Data:</strong> ${ipawz.dataBR(s.criado_em)}</p>
        <p><strong>Pet:</strong> <a href="detalhes-pet.html?id=${pet.id}">${ipawz.esc(pet.nome || "")}</a></p>
        <p><strong>Instituição:</strong> ${ipawz.esc(dono.nome || "")}</p>
        <p><strong>Status:</strong> ${NOME_STATUS[s.status]}</p>
        ${s.observacao ? `<p><strong>Recado da instituição:</strong> ${ipawz.esc(s.observacao)}</p>` : ""}
        ${s.status === "aprovada" ? "<p><strong>Informação:</strong> A solicitação de adoção está aprovada. Entre em contato com a instituição para combinar os próximos passos.</p>" : ""}
        ${contato}`;
    fundoModal.classList.add("aberto");
}

function fecharModal() {
    fundoModal.classList.remove("aberto");
}

/* ---------- eventos ---------- */
botaoFiltro.addEventListener("click", () => {
    const aberto = filtros.classList.toggle("aberto");
    botaoFiltro.setAttribute("aria-expanded", String(aberto));
});
filtroStatus.addEventListener("change", render);
document.getElementById("limparFiltro").addEventListener("click", () => {
    filtroStatus.value = "todos";
    render();
});

lista.addEventListener("click", (e) => {
    const alvo = e.target.closest("[data-detalhes], [data-etapa]");
    if (!alvo) return;
    if (alvo.dataset.detalhes) return abrirDetalhes(alvo.dataset.detalhes);
    // clicar numa etapa mostra a explicação dela
    const cartaoAtual = alvo.closest(".cartao-solicitacao");
    cartaoAtual.querySelectorAll(".etapa").forEach((etapa, i) =>
        etapa.classList.toggle("selecionada", i === Number(alvo.dataset.etapa)));
});

document.getElementById("fecharModal").addEventListener("click", fecharModal);
document.getElementById("botaoFecharModal").addEventListener("click", fecharModal);
fundoModal.addEventListener("click", (e) => {
    if (e.target === fundoModal) fecharModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        fecharModal();
        filtros.classList.remove("aberto");
    }
});

(async () => {
    try {
        solicitacoes = await ipawz.get("/adocoes/minhas");
        render();
        if (novaSolicitacao) {
            ipawz.aviso("Solicitação enviada! Acompanhe o andamento por aqui. 🐾", "sucesso");
            const cartao = document.getElementById("solicitacao-" + novaSolicitacao);
            if (cartao) cartao.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } catch (erro) {
        lista.innerHTML = `<p class="ipz-estado">${ipawz.esc(erro.message)}</p>`;
    }
})();
