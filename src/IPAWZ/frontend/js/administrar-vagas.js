/* =========================================================
   IPAWZ - ADMINISTRAR VAGAS (área da instituição)
   GET /api/vagas/minhas         lista com candidatos
   POST /api/vagas | PUT /api/vagas/:id
   PATCH /api/vagas/:id/ativa
   PATCH /api/candidaturas/:id/status
   ========================================================= */

const $ = (id) => document.getElementById(id);
const esc = ipawz.esc;

const NOME_STATUS = { enviada: "Pendente", analise: "Em análise", aceita: "Aprovado", negada: "Reprovado" };
const CLASSE_STATUS = { enviada: "status-pendente", analise: "status-pendente", aceita: "status-aprovado", negada: "status-reprovado" };

let vagas = [];

const tipoLabel = (v) => (v.tipo_servico === "outro" ? v.tipo_outro : v.tipo_servico);
const pendentes = (v) => v.candidaturas.filter((c) => c.status === "enviada" || c.status === "analise").length;

/* ---------------- LISTA ---------------- */

function render() {
    const ativas = vagas.filter((v) => v.ativa).length;
    const total = vagas.reduce((n, v) => n + v.candidaturas.length, 0);
    const totalPendentes = vagas.reduce((n, v) => n + pendentes(v), 0);

    $("resumoVagas").innerHTML = `
        <div class="resumo-item"><span class="resumo-icone">📋</span><div><strong>${vagas.length}</strong><span>Vagas cadastradas</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">✓</span><div><strong>${ativas}</strong><span>Vagas ativas</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">👥</span><div><strong>${totalPendentes}</strong><span>Candidaturas pendentes (${total} no total)</span></div></div>`;

    const busca = $("buscaVaga").value.toLowerCase();
    const filtro = $("filtroVaga").value;
    const lista = vagas.filter((v) =>
        (filtro === "todas" || (filtro === "ativa" ? v.ativa : !v.ativa)) && tipoLabel(v).toLowerCase().includes(busca));

    $("listaVagas").innerHTML = lista.length ? lista.map((v) => `
        <article class="vaga-card ${v.ativa ? "" : "vaga-inativa"}">
            <div class="vaga-topo">
                <div>
                    <h2>${esc(tipoLabel(v))}</h2>
                    <span class="status ${v.ativa ? "status-ativo" : "status-inativo"}">${v.ativa ? "Vaga ativa" : "Vaga inativa"}</span>
                </div>
            </div>
            <div class="vaga-meta">
                <span>📍 ${esc(v.local)}</span>
                <span>📅 ${ipawz.dataBR(v.data)}</span>
                <span>👥 ${v.candidaturas.length} candidato(s)</span>
            </div>
            <p>${esc(v.descricao)}</p>
            <div class="vaga-acoes">
                <button class="btn-outline" type="button" data-candidatos="${v.id}">Ver candidatos (${v.candidaturas.length})</button>
                <button class="btn-secundario" type="button" data-editar-vaga="${v.id}">Editar vaga</button>
                ${v.ativa
                    ? `<button class="btn-perigo" type="button" data-inativar-vaga="${v.id}">Inativar vaga</button>`
                    : `<button class="btn-secundario" type="button" data-ativar-vaga="${v.id}">Reativar vaga</button>`}
            </div>
        </article>`).join("")
        : `<p class="estado-vazio">${vagas.length ? "Nenhuma vaga encontrada." : "Você ainda não cadastrou vagas."}</p>`;
}

async function carregar() {
    try {
        vagas = await ipawz.get("/vagas/minhas");
        render();
    } catch (erro) {
        $("listaVagas").innerHTML = `<p class="estado-vazio">${esc(erro.message)}</p>`;
    }
}

/* ---------------- FORMULÁRIO (modal) ---------------- */

function atualizarCampoOutro() {
    const outro = $("tipoServico").value === "outro";
    $("campoOutroWrap").hidden = !outro;
    $("tipoServicoOutro").required = outro;
    if (!outro) $("tipoServicoOutro").value = "";
}

function abrirForm(v = null) {
    $("formVaga").reset();
    $("vagaId").value = v ? v.id : "";
    $("tituloModalVaga").textContent = v ? "Editar vaga" : "Cadastrar nova vaga";
    if (v) {
        $("tipoServico").value = v.tipo_servico;
        $("tipoServicoOutro").value = v.tipo_outro || "";
        $("vagaLocal").value = v.local;
        $("vagaData").value = v.data;
        $("vagaDescricao").value = v.descricao;
    }
    atualizarCampoOutro();
    $("modalVaga").hidden = false;
}

$("tipoServico").addEventListener("change", atualizarCampoOutro);
$("novaVaga").addEventListener("click", () => abrirForm());
$("buscaVaga").addEventListener("input", render);
$("filtroVaga").addEventListener("change", render);

$("formVaga").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("vagaId").value;
    const dados = new FormData($("formVaga"));
    if (!$("vagaImagem").files[0]) dados.delete("imagem");

    $("salvarVaga").disabled = true;
    try {
        if (id) await ipawz.put(`/vagas/${id}`, dados);
        else await ipawz.post("/vagas", dados);
        $("modalVaga").hidden = true;
        ipawz.aviso(id ? "Vaga atualizada com sucesso." : "Vaga cadastrada com sucesso.", "sucesso");
        await carregar();
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    } finally {
        $("salvarVaga").disabled = false;
    }
});

/* ---------------- CANDIDATOS (modal) ---------------- */

function abrirCandidatos(v) {
    $("subtituloCandidatos").textContent = `Vaga: ${tipoLabel(v)} • ${ipawz.dataBR(v.data)}`;
    $("listaCandidatos").innerHTML = v.candidaturas.length ? v.candidaturas.map((c) => `
        <article class="candidato-item">
            <div>
                <strong>${esc(c.voluntario ? c.voluntario.nome : "Voluntário")}</strong>
                <small>${esc(c.voluntario ? c.voluntario.email : "")}${c.voluntario && c.voluntario.telefone ? " • " + esc(c.voluntario.telefone) : ""}</small>
                ${c.voluntario && c.voluntario.experiencia_animais !== null && c.voluntario.experiencia_animais !== undefined
                    ? `<small>Experiência com animais: ${c.voluntario.experiencia_animais ? "sim" + (c.voluntario.experiencia_descricao ? " - " + esc(c.voluntario.experiencia_descricao) : "") : "não"}</small>` : ""}
                ${c.mensagem ? `<small>“${esc(c.mensagem)}”</small>` : ""}
                <span class="status ${CLASSE_STATUS[c.status]}">${NOME_STATUS[c.status]}</span>
            </div>
            <div class="candidato-acoes">
                ${c.status === "enviada" ? `<button class="btn-secundario" type="button" data-candidatura="${c.id}" data-status="analise">Em análise</button>` : ""}
                ${c.status === "enviada" || c.status === "analise" ? `
                    <button class="btn-principal" type="button" data-candidatura="${c.id}" data-status="aceita">Aprovar</button>
                    <button class="btn-perigo" type="button" data-candidatura="${c.id}" data-status="negada">Reprovar</button>` : ""}
            </div>
        </article>`).join("")
        : '<p class="estado-vazio">Ainda não há candidaturas para esta vaga.</p>';
    $("modalCandidatos").dataset.vaga = v.id;
    $("modalCandidatos").hidden = false;
}

/* ---------------- CLIQUES (delegação) ---------------- */

document.addEventListener("click", async (e) => {
    const d = e.target.dataset;
    if (d.fechar) $(d.fechar).hidden = true;

    const vaga = (id) => vagas.find((v) => v.id === Number(id));

    if (d.editarVaga) abrirForm(vaga(d.editarVaga));
    if (d.candidatos) abrirCandidatos(vaga(d.candidatos));

    if (d.inativarVaga || d.ativarVaga) {
        const ativa = Boolean(d.ativarVaga);
        if (!ativa && !confirm("Deseja inativar esta vaga? Ela deixará de aparecer como oportunidade ativa.")) return;
        try {
            await ipawz.patch(`/vagas/${d.inativarVaga || d.ativarVaga}/ativa`, { ativa });
            ipawz.aviso(ativa ? "Vaga reativada." : "Vaga inativada.", "sucesso");
            await carregar();
        } catch (erro) {
            ipawz.aviso(erro.message, "erro");
        }
    }

    if (d.candidatura) {
        try {
            await ipawz.patch(`/candidaturas/${d.candidatura}/status`, { status: d.status });
            ipawz.aviso(`Candidatura: ${NOME_STATUS[d.status].toLowerCase()}.`, "sucesso");
            await carregar();
            abrirCandidatos(vaga($("modalCandidatos").dataset.vaga));
        } catch (erro) {
            ipawz.aviso(erro.message, "erro");
        }
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach((m) => (m.hidden = true));
});

carregar();
