// =========================================================
// TELA: CANDIDATURAS DE VOLUNTARIADO - IPAWZ
// Para adicionar, remover ou editar candidaturas, altere a lista
// "candidaturas" abaixo. Não é necessário mexer no HTML dos cartões.
// =========================================================

/* As candidaturas vêm da API: GET /api/candidaturas/minhas
   Status no banco -> status/etapa usados na linha do tempo desta tela:
     enviada -> aguardando (etapa 1: candidatura recebida pela instituição)
     analise -> aguardando (etapa 2: currículo em análise)
     aceita / negada -> resultado final */
let candidaturas = [];

function converterDaApi(item) {
    const vaga = item.vaga || {};
    const status = item.status === "aceita" || item.status === "negada" ? item.status : "aguardando";
    return {
        id: item.id,
        data: ipawz.dataBR(item.criado_em),
        vaga: vaga.tipo_servico === "outro" ? vaga.tipo_outro : vaga.tipo_servico,
        vagaId: vaga.id,
        instituicao: vaga.instituicao ? vaga.instituicao.nome : "",
        status,
        etapa: item.status === "analise" ? 2 : 1
    };
}

async function carregarCandidaturas() {
    resultsMessage.textContent = "Carregando suas candidaturas...";
    try {
        const lista = await ipawz.get("/candidaturas/minhas");
        candidaturas = lista.map(converterDaApi);
        renderizarCandidaturas();
    } catch (erro) {
        resultsMessage.textContent = erro.message;
    }
}

const applicationsList = document.getElementById("applicationsList");
const resultsMessage = document.getElementById("resultsMessage");
const filterPanel = document.getElementById("filterPanel");
const filterBackdrop = document.getElementById("filterBackdrop");
const openFilterButton = document.getElementById("openFilter");
const closeFilterButton = document.getElementById("closeFilter");
const filterForm = document.getElementById("filterForm");
const clearFiltersButton = document.getElementById("clearFilters");

let statusSelecionado = null;

const nomesStatus = {
  aceita: "Aceita",
  aguardando: "Aguardando resposta",
  negada: "Negada"
};

const etapas = [
  "Candidatura<br>Enviada",
  "Candidatura<br>Recebida",
  "Currículo<br>em Análise",
  "Candidato<br>Aceito(a)"
];

function criarLinhaDoTempo(candidatura) {
  // O último passo muda conforme o status da candidatura.
  const nomesEtapas = [...etapas];

  if (candidatura.status === "negada") {
    nomesEtapas[3] = "Candidatura<br>Negada";
  } else if (candidatura.status === "aguardando") {
    nomesEtapas[3] = "Aguardando<br>resposta";
  }

  const passoAtual = candidatura.status === "aguardando"
    ? Math.max(0, candidatura.etapa)
    : 3;

  return `
    <div class="timeline" style="--step-count: ${nomesEtapas.length}">
      ${nomesEtapas.map((nome, indice) => {
        const concluido = indice < passoAtual ||
          (candidatura.status !== "aguardando" && indice === 3);
        const atual = candidatura.status === "aguardando" && indice === passoAtual;
        const final = indice === 3 && candidatura.status !== "aguardando";
        const classe = [
          "timeline-step",
          concluido ? "is-complete" : "",
          atual ? "is-current" : "",
          final ? "is-final" : ""
        ].filter(Boolean).join(" ");

        let simbolo = "";
        if (final && candidatura.status === "aceita") simbolo = "✓";
        if (final && candidatura.status === "negada") simbolo = "×";

        return `
          <div class="${classe}">
            <span class="timeline-dot">${simbolo}</span>
            <span class="timeline-label">${nome}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function criarCartao(candidatura) {
  const cartao = document.createElement("article");
  cartao.className = "application-card";

  cartao.innerHTML = `
    <div class="application-topline">
      <span>Data Candidatura: ${candidatura.data}</span>
      <span>Vaga: ${ipawz.esc(candidatura.vaga)}</span>
      <span>Instituição: ${ipawz.esc(candidatura.instituicao)}</span>
      <span class="status-pill">${nomesStatus[candidatura.status]}</span>
    </div>
    <div class="application-content">
      ${criarLinhaDoTempo(candidatura)}
      <div class="application-footer">
        <a class="details-link" href="detalhes-vaga-voluntariado.html?id=${candidatura.vagaId}">VER VAGA</a>
      </div>
    </div>
  `;

  return cartao;
}

function renderizarCandidaturas() {
  applicationsList.innerHTML = "";

  const candidaturasVisiveis = statusSelecionado
    ? candidaturas.filter(candidatura => candidatura.status === statusSelecionado)
    : candidaturas;

  if (candidaturasVisiveis.length === 0) {
    resultsMessage.innerHTML = candidaturas.length
      ? "Nenhuma candidatura encontrada para este status."
      : 'Você ainda não se candidatou a nenhuma vaga. <a href="vagas-voluntariado.html">Ver vagas abertas</a>';
    return;
  }

  resultsMessage.textContent = statusSelecionado
    ? `Exibindo ${candidaturasVisiveis.length} candidatura(s): ${nomesStatus[statusSelecionado]}.`
    : "";

  candidaturasVisiveis.forEach(candidatura => {
    applicationsList.appendChild(criarCartao(candidatura));
  });
}

function abrirFiltro() {
  filterPanel.classList.add("is-open");
  filterPanel.setAttribute("aria-hidden", "false");
  filterBackdrop.hidden = false;
  openFilterButton.setAttribute("aria-expanded", "true");
}

function fecharFiltro() {
  filterPanel.classList.remove("is-open");
  filterPanel.setAttribute("aria-hidden", "true");
  filterBackdrop.hidden = true;
  openFilterButton.setAttribute("aria-expanded", "false");
}

openFilterButton.addEventListener("click", abrirFiltro);
closeFilterButton.addEventListener("click", fecharFiltro);
filterBackdrop.addEventListener("click", fecharFiltro);

filterForm.addEventListener("submit", event => {
  event.preventDefault();

  const opcaoMarcada = filterForm.querySelector('input[name="status"]:checked');
  statusSelecionado = opcaoMarcada ? opcaoMarcada.value : null;

  renderizarCandidaturas();
  fecharFiltro();
});

clearFiltersButton.addEventListener("click", () => {
  statusSelecionado = null;
  filterForm.reset();
  renderizarCandidaturas();
  fecharFiltro();
});

carregarCandidaturas();
