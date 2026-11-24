/* =========================================================
   IPAWZ - MEUS PETS CADASTRADOS
   GET /api/pets/meus  |  PATCH /api/pets/:id/status
   Editar abre a tela de cadastro com ?id=
   ========================================================= */

const NOME_ESPECIE = { cachorro: "Cachorro", gato: "Gato", passaro: "Pássaro", outro: "Outro" };
const NOME_STATUS = { disponivel: "Disponível", inativo: "Inativo", adotado: "Adotado" };

let pets = [];

function renderResumo() {
    const disponiveis = pets.filter((p) => p.status === "disponivel").length;
    const adotados = pets.filter((p) => p.status === "adotado").length;
    document.getElementById("resumoPets").innerHTML = `
        <div class="resumo-item"><span class="resumo-icone">🐾</span><div><strong>${pets.length}</strong><span>Pets cadastrados</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">♥</span><div><strong>${disponiveis}</strong><span>Anúncios disponíveis</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">✓</span><div><strong>${adotados}</strong><span>Já adotados</span></div></div>`;
}

function cardPet(p) {
    const esc = ipawz.esc;
    const local = [p.cidade, p.uf].filter(Boolean).join(" - ");
    let acaoStatus = "";
    if (p.status === "disponivel") acaoStatus = `<button class="btn-perigo" data-inativar="${p.id}">Inativar anúncio</button>`;
    if (p.status === "inativo") acaoStatus = `<button class="btn-secundario" data-ativar="${p.id}">Reativar anúncio</button>`;

    return `
        <article class="pet-card">
            <img class="pet-foto" src="${esc(p.foto_url || ipawz.FOTO_PADRAO)}" alt="Foto de ${esc(p.nome)}">
            <div class="pet-conteudo">
                <div class="pet-topo">
                    <h2>${esc(p.nome)}</h2>
                    <span class="status ${p.status === "disponivel" ? "status-ativo" : "status-inativo"}">${NOME_STATUS[p.status]}</span>
                </div>
                <p class="pet-detalhes">${esc(NOME_ESPECIE[p.especie] || p.especie)} • ${esc(p.idade)}${local ? `<br>📍 ${esc(local)}` : ""}</p>
                <p class="pet-descricao">${esc(p.descricao || "")}</p>
                <div class="acoes-card">
                    <a class="btn-outline" href="cadastro-pet.html?id=${p.id}">Editar cadastro</a>
                    <a class="btn-secundario" href="detalhes-pet.html?id=${p.id}">Ver anúncio</a>
                    ${acaoStatus}
                </div>
            </div>
        </article>`;
}

function render() {
    renderResumo();
    const busca = document.getElementById("buscaPet").value.toLowerCase();
    const filtro = document.getElementById("filtroPet").value;
    const lista = pets.filter((p) => (filtro === "todos" || p.status === filtro) && p.nome.toLowerCase().includes(busca));
    document.getElementById("listaPets").innerHTML = lista.length
        ? lista.map(cardPet).join("")
        : `<p class="estado-vazio">${pets.length ? "Nenhum pet encontrado." : 'Você ainda não cadastrou pets. <a href="cadastro-pet.html">Cadastrar agora</a>'}</p>`;
}

async function mudarStatus(id, status, mensagem) {
    try {
        const atualizado = await ipawz.patch(`/pets/${id}/status`, { status });
        pets = pets.map((p) => (p.id === atualizado.id ? atualizado : p));
        render();
        ipawz.aviso(mensagem, "sucesso");
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    }
}

document.getElementById("buscaPet").addEventListener("input", render);
document.getElementById("filtroPet").addEventListener("change", render);

document.getElementById("listaPets").addEventListener("click", (e) => {
    const inativar = e.target.dataset.inativar;
    const ativar = e.target.dataset.ativar;
    if (inativar && confirm("Deseja inativar este anúncio? O pet continuará no seu histórico.")) {
        mudarStatus(Number(inativar), "inativo", "Anúncio inativado.");
    }
    if (ativar) mudarStatus(Number(ativar), "disponivel", "Anúncio reativado.");
});

(async () => {
    const lista = document.getElementById("listaPets");
    lista.innerHTML = '<p class="ipz-estado">Carregando seus pets...</p>';
    try {
        pets = await ipawz.get("/pets/meus");
        render();
    } catch (erro) {
        lista.innerHTML = `<p class="ipz-estado">${ipawz.esc(erro.message)}</p>`;
    }
})();
