/* =========================================================
   IPAWZ - LISTAGEM DE PETS (tela de Adoção)
   Os pets vêm do banco pela API: GET /api/pets
   Filtros e paginação são feitos no servidor.
   ========================================================= */

const listaPets = document.getElementById("listaPets");
const mensagemSemPets = document.getElementById("mensagemSemPets");
const paginacao = document.getElementById("paginacao");

const abrirFiltro = document.getElementById("abrirFiltro");
const fecharFiltro = document.getElementById("fecharFiltro");
const painelFiltro = document.getElementById("painelFiltro");
const filtroOverlay = document.getElementById("filtroOverlay");
const formFiltro = document.getElementById("formFiltro");
const limparFiltros = document.getElementById("limparFiltros");

const PETS_POR_PAGINA = 9;
const CAMPOS_FILTRO = ["especie", "sexo", "faixaEtaria", "porte", "temperamento"];

let paginaAtual = 1;
let filtrosAtuais = {};

/* ---------------- CARDS ---------------- */

function criarCard(pet) {
    const card = document.createElement("article");
    card.className = "card-pet";

    const imagem = document.createElement("img");
    imagem.src = pet.foto_url || ipawz.FOTO_PADRAO;
    imagem.alt = `${pet.nome}, ${pet.idade}`;
    imagem.loading = "lazy";

    const nome = document.createElement("div");
    nome.className = "nome-pet";
    nome.textContent = `${pet.nome}, ${pet.idade}`.toUpperCase();

    const conhecer = document.createElement("a");
    conhecer.href = `detalhes-pet.html?id=${pet.id}`;
    conhecer.className = "conheca-mais";
    conhecer.textContent = "CONHEÇA MAIS";

    card.append(imagem, nome, conhecer);
    return card;
}

function mostrarPets(pets) {
    listaPets.replaceChildren(...pets.map(criarCard));
    mensagemSemPets.hidden = pets.length > 0;
}

/* ---------------- PAGINAÇÃO ---------------- */

function botaoPagina(texto, pagina, opcoes = {}) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = opcoes.seta ? "seta-paginacao" : "numero-pagina" + (pagina === paginaAtual ? " ativa" : "");
    botao.textContent = texto;
    botao.disabled = Boolean(opcoes.desativado);
    if (opcoes.rotulo) botao.setAttribute("aria-label", opcoes.rotulo);
    if (pagina === paginaAtual && !opcoes.seta) botao.setAttribute("aria-current", "page");
    botao.addEventListener("click", () => irParaPagina(pagina));
    return botao;
}

function montarPaginacao(totalPaginas) {
    paginacao.replaceChildren();
    paginacao.hidden = totalPaginas <= 1;
    if (totalPaginas <= 1) return;

    paginacao.append(botaoPagina("‹", paginaAtual - 1, { seta: true, desativado: paginaAtual === 1, rotulo: "Página anterior" }));
    for (let p = 1; p <= totalPaginas; p++) paginacao.append(botaoPagina(String(p), p));
    paginacao.append(botaoPagina("›", paginaAtual + 1, { seta: true, desativado: paginaAtual === totalPaginas, rotulo: "Próxima página" }));
}

function irParaPagina(pagina) {
    paginaAtual = pagina;
    carregarPets();
    document.querySelector(".pagina-adocao").scrollIntoView({ behavior: "smooth" });
}

/* ---------------- BUSCA NA API ---------------- */

async function carregarPets() {
    listaPets.innerHTML = '<p class="ipz-estado">Carregando pets...</p>';
    mensagemSemPets.hidden = true;

    const parametros = new URLSearchParams({ pagina: paginaAtual, limite: PETS_POR_PAGINA });
    for (const [campo, valor] of Object.entries(filtrosAtuais)) {
        if (valor !== "indiferente") parametros.set(campo, valor);
    }

    try {
        const resposta = await ipawz.get("/pets?" + parametros);
        mostrarPets(resposta.itens);
        montarPaginacao(resposta.totalPaginas);
    } catch (erro) {
        listaPets.innerHTML = `<p class="ipz-estado">${ipawz.esc(erro.message)}</p>`;
        paginacao.hidden = true;
    }
}

/* ---------------- PAINEL DE FILTROS ---------------- */

function abrirPainelFiltro() {
    painelFiltro.classList.add("aberto");
    filtroOverlay.classList.add("ativo");
    painelFiltro.setAttribute("aria-hidden", "false");
    abrirFiltro.setAttribute("aria-expanded", "true");
}

function fecharPainelFiltro() {
    painelFiltro.classList.remove("aberto");
    filtroOverlay.classList.remove("ativo");
    painelFiltro.setAttribute("aria-hidden", "true");
    abrirFiltro.setAttribute("aria-expanded", "false");
}

function valorSelecionado(nomeDoCampo) {
    const marcada = formFiltro.querySelector(`input[name="${nomeDoCampo}"]:checked`);
    return marcada ? marcada.value : "indiferente";
}

abrirFiltro.addEventListener("click", abrirPainelFiltro);
fecharFiltro.addEventListener("click", fecharPainelFiltro);
filtroOverlay.addEventListener("click", fecharPainelFiltro);

formFiltro.addEventListener("submit", (event) => {
    event.preventDefault();
    filtrosAtuais = Object.fromEntries(CAMPOS_FILTRO.map((campo) => [campo, valorSelecionado(campo)]));
    fecharPainelFiltro();
    irParaPagina(1);
});

// Antes este botão só funcionava depois de aplicar um filtro (estava dentro do submit)
limparFiltros.addEventListener("click", () => {
    formFiltro.reset(); // volta todas as opções para "Indiferente"
    filtrosAtuais = {};
    fecharPainelFiltro();
    irParaPagina(1);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharPainelFiltro();
});

carregarPets();
