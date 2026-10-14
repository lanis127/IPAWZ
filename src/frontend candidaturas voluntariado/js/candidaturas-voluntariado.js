// =========================================================
// TELA: CANDIDATURAS DE VOLUNTARIADO - IPAWZ
// Para adicionar, remover ou editar candidaturas, altere a lista
// "candidaturas" abaixo. Não é necessário mexer no HTML dos cartões.
// =========================================================

const candidaturas = [
  {
    id: 1,
    data: "23/07/2027",
    vaga: "Recepcionista",
    instituicao: "Projeto Patas Unidas",
    status: "aguardando",
    etapa: 2
  },
  {
    id: 2,
    data: "17/04/2027",
    vaga: "Cuidador",
    instituicao: "Centro de Acolhimento Animal",
    status: "aceita",
    etapa: 3
  },
  {
    id: 3,
    data: "18/09/2026",
    vaga: "Apoio Logístico",
    instituicao: "ONG Amigo de Quatro Patas",
    status: "negada",
    etapa: 3
  },
  {
    id: 4,
    data: "05/08/2027",
    vaga: "Auxiliar de Eventos",
    instituicao: "Feira Pet Solidária",
    status: "aguardando",
    etapa: 2
  },
  {
    id: 5,
    data: "29/06/2027",
    vaga: "Monitor de Recreação",
    instituicao: "Espaço Bicho Feliz",
    status: "aceita",
    etapa: 3
  },
  {
    id: 6,
    data: "11/05/2027",
    vaga: "Fotografia e Redes Sociais",
    instituicao: "Adote um Amigo",
    status: "negada",
    etapa: 3
  },
  {
    id: 7,
    data: "02/04/2027",
    vaga: "Organização de Doações",
    instituicao: "Instituto Laços Animais",
    status: "aguardando",
    etapa: 1
  },
  {
    id: 8,
    data: "14/03/2027",
    vaga: "Banho e Higiene",
    instituicao: "Clínica Veterinária Comunitária",
    status: "aceita",
    etapa: 3
  },
  {
    id: 9,
    data: "21/02/2027",
    vaga: "Transporte de Animais",
    instituicao: "Rede de Proteção Animal",
    status: "negada",
    etapa: 3
  }
];

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
      <span>Vaga: ${candidatura.vaga}</span>
      <span>Instituição: ${candidatura.instituicao}</span>
      <span class="status-pill">${nomesStatus[candidatura.status]}</span>
    </div>
    <div class="application-content">
      ${criarLinhaDoTempo(candidatura)}
      <div class="application-footer">
        <!-- Link reservado para a futura página de detalhes.
             Por enquanto, o clique não navega para outra página. -->
        <a class="details-link" href="#" data-details-id="${candidatura.id}">VER DETALHES</a>
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
    resultsMessage.textContent = "Nenhuma candidatura encontrada para este status.";
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

// O link fica preparado, mas ainda não leva a uma página.
// Quando a página de detalhes existir, substitua o href="#" por
// algo como href="../html/detalhes-vaga.html?id=1" e remova este listener.
applicationsList.addEventListener("click", event => {
  const linkDetalhes = event.target.closest(".details-link");
  if (!linkDetalhes) return;

  event.preventDefault();
  // Futuramente, a navegação para a página de detalhes será adicionada aqui.
});


/* =========================================================
   MENU LATERAL (SIDEBAR)
   ========================================================= */

const openMenuButton = document.getElementById("openMenu");
const closeMenuButton = document.getElementById("closeMenu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function abrirMenu() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    openMenuButton.setAttribute("aria-expanded", "true");
}

function fecharMenu() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    openMenuButton.setAttribute("aria-expanded", "false");
}

openMenuButton.addEventListener("click", abrirMenu);
closeMenuButton.addEventListener("click", fecharMenu);
overlay.addEventListener("click", fecharMenu);

renderizarCandidaturas();
