/* =========================================================
   IPAWZ - SOLICITAÇÕES DE ADOÇÃO RECEBIDAS
   Para quem cadastrou pets: instituição ou pessoa física.
   Cada um vê só as solicitações dos próprios pets.
   GET /api/adocoes/recebidas
   PATCH /api/adocoes/:id/status { status, observacao }
   ========================================================= */

const linhas = document.getElementById("linhas");
const estado = document.getElementById("estado");
const detalhes = document.getElementById("detalhes");
const respostas = document.getElementById("respostas");

const NOME_STATUS = { enviada: "Nova", recebida: "Recebida", analise: "Em análise", aprovada: "Aprovado", recusada: "Rejeitado" };
const CLASSE_STATUS = { enviada: "status-nova", recebida: "status-nova", analise: "status-analise", aprovada: "status-aprovada", recusada: "status-recusada" };
const PENDENTES = ["enviada", "recebida", "analise"];

let solicitacoes = [];
let filtro = "todas";
let selecionada = null;

const iconePessoa = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

function render() {
    const visiveis = solicitacoes.filter((s) =>
        filtro === "todas" || (filtro === "pendentes" ? PENDENTES.includes(s.status) : s.status === filtro));

    linhas.innerHTML = visiveis.map((s) => `
        <tr class="${selecionada && selecionada.id === s.id ? "selecionada" : ""}">
            <td><div class="celula-pessoa"><span class="avatar">${iconePessoa}</span>${ipawz.esc(s.adotante ? s.adotante.nome : "-")}</div></td>
            <td><div class="celula-pet"><img src="${ipawz.esc(s.pet.foto_url || ipawz.FOTO_PADRAO)}" alt="">${ipawz.esc(s.pet.nome)}</div></td>
            <td>${ipawz.dataBR(s.criado_em)}</td>
            <td class="${CLASSE_STATUS[s.status]}">${NOME_STATUS[s.status]}</td>
            <td><button class="botao-ver" type="button" data-ver="${s.id}">[Ver]</button></td>
        </tr>`).join("");

    estado.innerHTML = solicitacoes.length
        ? (visiveis.length ? "" : "Nenhuma solicitação neste filtro.")
        : 'Você ainda não recebeu solicitações de adoção. Elas aparecem aqui quando alguém pede para adotar um pet que você <a href="cadastro-pet.html">cadastrou</a>.';
}

async function abrir(id) {
    selecionada = solicitacoes.find((s) => s.id === Number(id));
    if (!selecionada) return;
    const s = selecionada;
    const a = s.adotante || {};

    document.getElementById("det-foto").src = s.pet.foto_url || ipawz.FOTO_PADRAO;
    document.getElementById("det-pet").textContent = s.pet.nome;
    // Dados da validação do adotante: ele não precisa preencher de novo em cada pedido
    const cpf = a.cpf ? a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "-";
    const endereco = [a.rua && `${a.rua}, ${a.numero || "s/n"}`, a.complemento, a.bairro, [a.cidade, a.estado].filter(Boolean).join(" - ")]
        .filter(Boolean).join(", ");
    const experiencia = a.experiencia_animais === true
        ? `Sim${a.experiencia_descricao ? ": " + a.experiencia_descricao : ""}`
        : a.experiencia_animais === false ? "Não" : "-";
    const selo = { aprovado: "validado ✓", pendente: "validação em análise", rejeitado: "validação recusada" }[a.status_validacao] || "";
    document.getElementById("det-solicitante").innerHTML = `
        Solicitante: ${ipawz.esc(a.nome || "")}${selo ? ` <em>(${selo})</em>` : ""}<br>
        E-mail: ${ipawz.esc(a.email || "")}<br>
        Telefone: ${ipawz.esc(a.telefone || "-")}<br>
        CPF: ${ipawz.esc(cpf)}<br>
        Endereço: ${ipawz.esc(endereco || "-")}<br>
        Experiência com animais: ${ipawz.esc(experiencia)}`;
    document.getElementById("det-observacao").value = s.observacao || "";
    document.querySelectorAll("#botoes-status button").forEach((b) => (b.disabled = b.dataset.status === s.status || s.status === "aprovada"));

    respostas.hidden = true;
    respostas.innerHTML = "<dl>" + (Array.isArray(s.respostas) ? s.respostas : []).map((r) =>
        `<dt>${ipawz.esc(r.pergunta)}</dt><dd>${ipawz.esc(r.resposta)}</dd>`).join("") + "</dl>";

    detalhes.hidden = false;
    render();
    detalhes.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Ao abrir pela primeira vez, marca como "recebida" para o adotante ver o andamento
    if (s.status === "enviada") await mudarStatus("recebida", true);
}

async function mudarStatus(status, silencioso) {
    if (status === "aprovada" && !confirm(`Aprovar a adoção de ${selecionada.pet.nome}? O pet sairá da listagem.`)) return;
    try {
        const atualizada = await ipawz.patch(`/adocoes/${selecionada.id}/status`, {
            status,
            observacao: document.getElementById("det-observacao").value
        });
        Object.assign(selecionada, atualizada);
        if (!silencioso) ipawz.aviso(`Solicitação: ${NOME_STATUS[status].toLowerCase()}.`, "sucesso");
        abrir(selecionada.id);
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    }
}

document.querySelectorAll("[data-filtro]").forEach((botao) => {
    botao.addEventListener("click", () => {
        filtro = botao.dataset.filtro;
        document.querySelectorAll("[data-filtro]").forEach((b) => b.classList.toggle("ativo", b === botao));
        render();
    });
});

linhas.addEventListener("click", (e) => {
    const id = e.target.dataset.ver;
    if (id) abrir(id);
});

document.getElementById("botoes-status").addEventListener("click", (e) => {
    if (e.target.dataset.status) mudarStatus(e.target.dataset.status);
});

document.getElementById("ver-formulario").addEventListener("click", () => {
    respostas.hidden = !respostas.hidden;
});

(async () => {
    try {
        solicitacoes = await ipawz.get("/adocoes/recebidas");
        render();
    } catch (erro) {
        estado.textContent = erro.message;
    }
})();
