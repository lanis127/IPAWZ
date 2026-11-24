/* =========================================================
   IPAWZ - HISTÓRICO DE DOAÇÕES (PF) e DOAÇÕES RECEBIDAS (instituição)
   As duas telas usam este arquivo. O <body data-modo="..."> diz qual é:
     feitas    -> historico-doacoes.html   GET /api/doacoes/minhas
     recebidas -> doacoes-recebidas.html   GET /api/doacoes/recebidas
   ========================================================= */

const MODO = document.body.dataset.modo; // "feitas" | "recebidas"
const RECEBIDAS = MODO === "recebidas";

const NOME_TIPO = {
    financeira: "Financeira", alimentos: "Alimentos", medicamentos: "Medicamentos",
    acessorios: "Itens e acessórios", higiene: "Higiene e limpeza"
};
const NOME_STATUS = { registrada: "Registrada", confirmada: "Confirmada", entregue: "Entregue" };
// doação financeira = Pix: "registrada" quer dizer que a instituição ainda não viu o dinheiro cair
const NOME_STATUS_PIX = { registrada: "Aguardando Pix", confirmada: "Pix confirmado", entregue: "Pix confirmado" };
const CLASSE_STATUS = { registrada: "status-pendente", confirmada: "status-ativo", entregue: "status-ativo" };

let doacoes = [];

const moeda = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const outraParte = (d) => (RECEBIDAS ? (d.doador && d.doador.nome) || d.nome : d.instituicao && d.instituicao.nome) || "-";

function descricao(d) {
    if (d.tipo === "financeira") {
        const extra = [d.detalhes.metodo, d.detalhes.txid].filter(Boolean).join(" · ");
        return moeda(d.valor) + (extra ? ` (${extra})` : "");
    }
    return [d.detalhes.item, d.detalhes.quantidade].filter(Boolean).join(" - ");
}

function renderResumo() {
    // só soma o que a instituição já confirmou que recebeu
    const total = doacoes.filter((d) => d.tipo === "financeira" && d.status !== "registrada").reduce((s, d) => s + Number(d.valor || 0), 0);
    const pessoas = new Set(doacoes.map(outraParte)).size;
    document.getElementById("resumoDoacoes").innerHTML = `
        <div class="resumo-item"><span class="resumo-icone">♥</span><div><strong>${doacoes.length}</strong><span>Doações ${RECEBIDAS ? "recebidas" : "realizadas"}</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">🏛</span><div><strong>${pessoas}</strong><span>${RECEBIDAS ? "Doadores diferentes" : "Instituições apoiadas"}</span></div></div>
        <div class="resumo-item"><span class="resumo-icone">R$</span><div><strong>${moeda(total)}</strong><span>Total confirmado em doações por Pix</span></div></div>`;
}

// Instituição: botão para confirmar que recebeu / que foi entregue
// Pessoa física: botão para ver de novo o QR Code de um Pix ainda não confirmado
function acoes(d) {
    if (!RECEBIDAS) {
        const verPix = d.tipo === "financeira" && d.status === "registrada"
            ? `<button class="btn-secundario" type="button" data-pix="${d.id}">Ver QR Code Pix</button>` : "";
        return `<td class="acoes-doacao">${verPix}</td>`;
    }
    const proximo = d.tipo === "financeira"
        ? { registrada: ["confirmada", "Confirmar Pix recebido"] }[d.status]
        : { registrada: ["confirmada", "Confirmar"], confirmada: ["entregue", "Marcar entregue"] }[d.status];
    const contato = `<a class="btn-outline" href="mailto:${ipawz.esc(d.email)}">Contato</a>`;
    return `<td class="acoes-doacao">${contato}${proximo ? ` <button class="btn-secundario" type="button" data-doacao="${d.id}" data-status="${proximo[0]}">${proximo[1]}</button>` : ""}</td>`;
}

function render() {
    const busca = document.getElementById("buscaDoacao").value.toLowerCase();
    const tipo = document.getElementById("filtroTipo").value;
    const periodo = document.getElementById("filtroPeriodo").value;
    const limite = periodo === "todos" ? null : Date.now() - Number(periodo) * 86400000;

    const itens = doacoes.filter((d) =>
        (tipo === "todos" || d.tipo === tipo) &&
        outraParte(d).toLowerCase().includes(busca) &&
        (!limite || new Date(d.criado_em).getTime() >= limite));

    document.getElementById("quantidadeDoacoes").textContent = `${itens.length} registro(s)`;
    document.getElementById("listaDoacoes").innerHTML = itens.map((d) => `
        <tr>
            <td class="tipo-doacao">${NOME_TIPO[d.tipo]}</td>
            <td>${ipawz.esc(outraParte(d))}</td>
            <td>${ipawz.dataBR(d.criado_em)}</td>
            <td>${ipawz.esc(descricao(d))}</td>
            <td><span class="status ${CLASSE_STATUS[d.status] || "status-ativo"}">${(d.tipo === "financeira" ? NOME_STATUS_PIX : NOME_STATUS)[d.status] || d.status}</span></td>
            ${acoes(d)}
        </tr>`).join("");
    document.getElementById("vazioDoacoes").hidden = itens.length > 0;
}

["buscaDoacao", "filtroTipo", "filtroPeriodo"].forEach((id) =>
    document.getElementById(id).addEventListener(id === "buscaDoacao" ? "input" : "change", render));

/* ---------- QR Code do Pix (histórico da pessoa física) ---------- */
const modalPix = document.getElementById("modal-pix");
function fecharModalPix() { if (modalPix) modalPix.hidden = true; }
if (modalPix) {
    document.getElementById("fechar-modal-pix").addEventListener("click", fecharModalPix);
    modalPix.addEventListener("click", (e) => { if (e.target === modalPix) fecharModalPix(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharModalPix(); });
}

async function abrirPix(id, botao) {
    botao.disabled = true;
    try {
        ipawzPix.mostrar(document.getElementById("painel-pix-modal"), await ipawz.get(`/doacoes/${id}/pix`));
        modalPix.hidden = false;
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    } finally {
        botao.disabled = false;
    }
}

document.getElementById("listaDoacoes").addEventListener("click", async (e) => {
    if (e.target.dataset.pix) return abrirPix(e.target.dataset.pix, e.target);
    const id = e.target.dataset.doacao;
    if (!id) return;
    try {
        const atualizada = await ipawz.patch(`/doacoes/${id}/status`, { status: e.target.dataset.status });
        doacoes = doacoes.map((d) => (d.id === atualizada.id ? { ...d, status: atualizada.status } : d));
        render();
        ipawz.aviso("Doação atualizada.", "sucesso");
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    }
});

(async () => {
    try {
        if (RECEBIDAS) {
            const perfil = await ipawz.get("/perfil");
            document.getElementById("aviso-sem-pix").hidden = Boolean(perfil.pix_chave);
        }
        doacoes = await ipawz.get(RECEBIDAS ? "/doacoes/recebidas" : "/doacoes/minhas");
        renderResumo();
        render();
    } catch (erro) {
        document.getElementById("vazioDoacoes").hidden = false;
        document.getElementById("vazioDoacoes").textContent = erro.message;
    }
})();
