/* =========================================================
   IPAWZ - VAGAS DE VOLUNTARIADO
   GET /api/vagas  (só vagas ativas)
   "Mais infos" abre detalhes-vaga-voluntariado.html?id=<id>
   ========================================================= */

const listaVagas = document.getElementById("lista-vagas");

function tituloDaVaga(vaga) {
    return vaga.tipo_servico === "outro" ? vaga.tipo_outro : vaga.tipo_servico;
}

function cardVaga(vaga) {
    const esc = ipawz.esc;
    const instituicao = vaga.instituicao ? vaga.instituicao.nome : "";
    return `
        <article class="vaga">
            <div class="vaga-principal">
                <h2>${esc(tituloDaVaga(vaga))}</h2>
                <p class="instituicao">INSTITUIÇÃO: ${esc(instituicao.toUpperCase())}</p>
                <p class="localizacao">
                    <span class="icone-local">📍</span>
                    ${esc(vaga.local.toUpperCase())}
                </p>
            </div>
            <div class="vaga-secundaria">
                <a class="mais-infos" href="detalhes-vaga-voluntariado.html?id=${vaga.id}">MAIS INFOS</a>
                <time class="data" datetime="${esc(vaga.data)}">${ipawz.dataBR(vaga.data)}</time>
            </div>
        </article>`;
}

(async () => {
    try {
        const vagas = await ipawz.get("/vagas");
        listaVagas.innerHTML = vagas.length
            ? vagas.map(cardVaga).join("")
            : '<p class="ipz-estado">Nenhuma vaga aberta no momento. Volte em breve!</p>';
    } catch (erro) {
        listaVagas.innerHTML = `<p class="ipz-estado">${ipawz.esc(erro.message)}</p>`;
    }
})();
