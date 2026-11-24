const cardsDoacao = document.querySelectorAll(".card-doacao");
const areaFormulario = document.querySelector("#area-formulario");
const tituloFormulario = document.querySelector("#titulo-formulario");
const descricaoFormulario = document.querySelector("#descricao-formulario");
const camposEspecificos = document.querySelector("#campos-especificos");
const formDoacao = document.querySelector("#form-doacao");
const mensagemFormulario = document.querySelector("#mensagem-formulario");

const tiposDoacao = {
    financeira: {
        titulo: "Doação financeira",
        descricao: "Escolha o valor. Depois você paga por Pix, direto para a instituição.",
        campos: `
            <div class="campo">
                <label for="valor">Valor da doação (R$)</label>
                <input id="valor" name="valor" type="number" min="1" max="10000" step="0.01" placeholder="Ex.: 50,00" required>
                <div class="valores-rapidos" aria-label="Valores sugeridos">
                    <button type="button" data-valor="10">R$ 10</button>
                    <button type="button" data-valor="25">R$ 25</button>
                    <button type="button" data-valor="50">R$ 50</button>
                    <button type="button" data-valor="100">R$ 100</button>
                </div>
            </div>
            <div class="campo">
                <span class="rotulo-campo">Forma de pagamento</span>
                <div class="forma-pix"><strong>PIX</strong> QR Code ou copia e cola, na hora</div>
            </div>`
    },
    alimentos: {
        titulo: "Doação de alimentos",
        descricao: "Informe quais alimentos para pets você gostaria de doar.",
        campos: `
            <div class="campo">
                <label for="item">Alimento</label>
                <input id="item" name="item" type="text" placeholder="Ex.: ração para cães" required>
            </div>
            <div class="campo">
                <label for="quantidade">Quantidade</label>
                <input id="quantidade" name="quantidade" type="text" placeholder="Ex.: 2 pacotes de 5 kg" required>
            </div>
            <div class="campo">
                <label for="validade">Data de validade (se aplicável)</label>
                <input id="validade" name="validade" type="date">
            </div>
            <div class="campo">
                <label for="embalagem">Condição da embalagem</label>
                <select id="embalagem" name="embalagem" required>
                    <option value="">Selecione uma opção</option>
                    <option>Lacrada</option>
                    <option>Aberta, dentro da validade</option>
                    <option>Não se aplica</option>
                </select>
            </div>`
    },
    medicamentos: {
        titulo: "Medicamentos e saúde",
        descricao: "Descreva o medicamento ou insumo veterinário que deseja doar.",
        campos: `
            <div class="campo">
                <label for="item">Medicamento ou insumo</label>
                <input id="item" name="item" type="text" placeholder="Nome do produto" required>
            </div>
            <div class="campo">
                <label for="quantidade">Quantidade</label>
                <input id="quantidade" name="quantidade" type="text" placeholder="Ex.: 3 unidades" required>
            </div>
            <div class="campo">
                <label for="validade">Data de validade</label>
                <input id="validade" name="validade" type="date" required>
            </div>
            <div class="campo">
                <label for="lacre">Embalagem</label>
                <select id="lacre" name="lacre" required>
                    <option value="">Selecione uma opção</option>
                    <option>Lacrada</option>
                    <option>Em uso / aberta</option>
                </select>
            </div>`
    },
    acessorios: {
        titulo: "Itens e acessórios",
        descricao: "Informe os itens que você pretende disponibilizar para os animais.",
        campos: `
            <div class="campo">
                <label for="item">Nome do item</label>
                <input id="item" name="item" type="text" placeholder="Ex.: caminha para cães" required>
            </div>
            <div class="campo">
                <label for="quantidade">Quantidade</label>
                <input id="quantidade" name="quantidade" type="number" min="1" step="1" placeholder="Ex.: 2" required>
            </div>
            <div class="campo campo-largo">
                <label for="condicao">Condição do item</label>
                <select id="condicao" name="condicao" required>
                    <option value="">Selecione uma opção</option>
                    <option>Novo</option>
                    <option>Seminovo, em boas condições</option>
                </select>
            </div>`
    },
    higiene: {
        titulo: "Higiene e limpeza",
        descricao: "Conte quais produtos de higiene e limpeza você deseja doar.",
        campos: `
            <div class="campo">
                <label for="item">Produto</label>
                <input id="item" name="item" type="text" placeholder="Ex.: tapete higiênico" required>
            </div>
            <div class="campo">
                <label for="quantidade">Quantidade</label>
                <input id="quantidade" name="quantidade" type="text" placeholder="Ex.: 1 pacote" required>
            </div>
            <div class="campo">
                <label for="embalagem">Condição</label>
                <select id="embalagem" name="embalagem" required>
                    <option value="">Selecione uma opção</option>
                    <option>Lacrado</option>
                    <option>Aberto, em boas condições</option>
                    <option>Não se aplica</option>
                </select>
            </div>`
    }
};

function abrirFormulario(tipo) {
    const dados = tiposDoacao[tipo];
    if (!dados) return;

    cardsDoacao.forEach((card) => {
        const selecionado = card.dataset.tipo === tipo;
        card.classList.toggle("selecionado", selecionado);
        card.setAttribute("aria-pressed", String(selecionado));
    });

    tituloFormulario.textContent = dados.titulo;
    descricaoFormulario.textContent = dados.descricao;
    camposEspecificos.innerHTML = dados.campos;
    areaFormulario.hidden = false;
    mensagemFormulario.textContent = "";

    // Ao trocar de tipo, limpa os dados para evitar misturar campos de formulários diferentes.
    formDoacao.reset();
    areaPix.hidden = true;
    formDoacao.hidden = false;
    ajustarParaTipo(tipo);

    areaFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharFormulario() {
    areaFormulario.hidden = true;
    cardsDoacao.forEach((card) => {
        card.classList.remove("selecionado");
        card.setAttribute("aria-pressed", "false");
    });
    mensagemFormulario.textContent = "";
}

cardsDoacao.forEach((card) => {
    card.setAttribute("aria-pressed", "false");
    card.addEventListener("click", () => abrirFormulario(card.dataset.tipo));
});

document.querySelector("#fechar-formulario").addEventListener("click", fecharFormulario);
document.querySelector("#cancelar-formulario").addEventListener("click", fecharFormulario);

/* ---------- Pix: só instituições com chave Pix recebem doação financeira ---------- */
const areaPix = document.querySelector("#area-pix");
const avisoFormulario = document.querySelector("#aviso-formulario");
let instituicoes = [];

const AVISO_ITENS = "A IPAWZ registra sua intenção de doação e avisa a instituição, que entrará em contato para combinar a entrega.";
const AVISO_PIX = "O Pix vai direto para a conta da instituição. A IPAWZ não recebe nem guarda o dinheiro.";

function ajustarParaTipo(tipo) {
    const financeira = tipo === "financeira";
    avisoFormulario.textContent = financeira ? AVISO_PIX : AVISO_ITENS;
    formDoacao.querySelector(".botao-enviar").textContent = financeira ? "Gerar QR Code Pix" : "Registrar doação";

    // na doação financeira, quem não tem chave Pix fica indisponível na lista
    const select = document.getElementById("instituicaoId");
    for (const opcao of select.options) {
        const ong = instituicoes.find((i) => i.id === opcao.value);
        if (!ong) continue;
        const semPix = financeira && !ong.aceita_pix;
        opcao.disabled = semPix;
        opcao.textContent = rotuloInstituicao(ong) + (semPix ? " (ainda não recebe Pix)" : "");
    }
    if (select.selectedOptions[0] && select.selectedOptions[0].disabled) select.value = "";

    const escolhida = instituicoes.find((i) => i.id === instituicaoEscolhida);
    if (financeira && escolhida && !escolhida.aceita_pix) {
        mensagemFormulario.textContent = `${escolhida.nome} ainda não recebe doações por Pix. Escolha outra instituição ou doe itens.`;
    }
}

// botões R$ 10 / 25 / 50 / 100
camposEspecificos.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-valor]");
    if (!botao) return;
    formDoacao.valor.value = botao.dataset.valor;
    camposEspecificos.querySelectorAll("[data-valor]").forEach((b) => b.classList.toggle("ativo", b === botao));
});
camposEspecificos.addEventListener("input", (e) => {
    if (e.target.id === "valor") camposEspecificos.querySelectorAll("[data-valor]").forEach((b) => b.classList.toggle("ativo", b.dataset.valor === e.target.value));
});

function mostrarPix(doacao) {
    formDoacao.hidden = true;
    ipawzPix.mostrar(document.getElementById("painel-pix"), doacao.pix);
    const sessao = ipawz.obterSessao();
    document.getElementById("ir-historico").hidden = !(sessao && sessao.usuario.tipo === "pf");
    areaPix.hidden = false;
    areaPix.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("nova-doacao").addEventListener("click", () => {
    areaPix.hidden = true;
    formDoacao.hidden = false;
    fecharFormulario();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- envio para a API: POST /api/doacoes ---------- */
let tipoSelecionado = null;
cardsDoacao.forEach((card) => card.addEventListener("click", () => (tipoSelecionado = card.dataset.tipo)));

const botaoEnviar = formDoacao.querySelector(".botao-enviar");

// Instituição escolhida no carrossel da página de Doação: doacao.html -> tipos-doacao.html?instituicao=<id>
const instituicaoEscolhida = ipawz.parametroUrl("instituicao");

// O reset do formulário ao trocar de tipo apagaria os dados: preenche de novo
function preencherDadosDoUsuario() {
    const select = document.getElementById("instituicaoId");
    const opcao = [...select.options].find((o) => o.value === instituicaoEscolhida);
    if (opcao && !opcao.disabled) select.value = instituicaoEscolhida;
    const sessao = ipawz.obterSessao();
    if (!sessao) return;
    if (!formDoacao.nome.value) formDoacao.nome.value = sessao.usuario.nome || "";
    if (!formDoacao.email.value) formDoacao.email.value = sessao.usuario.email || "";
    if (!formDoacao.telefone.value) formDoacao.telefone.value = sessao.usuario.telefone || "";
}
cardsDoacao.forEach((card) => card.addEventListener("click", preencherDadosDoUsuario));

function rotuloInstituicao(i) {
    return i.nome + (i.cidade ? ` - ${i.cidade}/${i.estado || ""}` : "");
}

async function carregarInstituicoes() {
    const select = document.getElementById("instituicaoId");
    try {
        const lista = await ipawz.get("/instituicoes");
        instituicoes = lista;
        select.innerHTML = lista.length
            ? '<option value="">Selecione uma instituição</option>' + lista.map((i) =>
                `<option value="${i.id}">${ipawz.esc(rotuloInstituicao(i))}</option>`).join("")
            : '<option value="">Nenhuma instituição cadastrada ainda</option>';
        if (tipoSelecionado) ajustarParaTipo(tipoSelecionado);
        if (instituicaoEscolhida) {
            const opcaoEscolhida = [...select.options].find((o) => o.value === instituicaoEscolhida);
            if (opcaoEscolhida && !opcaoEscolhida.disabled) select.value = instituicaoEscolhida;
            const ong = lista.find((i) => i.id === instituicaoEscolhida);
            if (ong) {
                const aviso = document.getElementById("ong-escolhida");
                aviso.innerHTML = `Você está doando para <strong>${ipawz.esc(ong.nome)}</strong>. Escolha abaixo o tipo de doação.`
                    + (ong.aceita_pix ? "" : " Esta instituição ainda não recebe doações financeiras por Pix.");
                aviso.hidden = false;
            }
        }
    } catch (erro) {
        select.innerHTML = `<option value="">${ipawz.esc(erro.message)}</option>`;
    }
}

formDoacao.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!formDoacao.checkValidity()) {
        formDoacao.reportValidity();
        return;
    }

    const dados = Object.fromEntries(new FormData(formDoacao).entries());
    dados.tipo = tipoSelecionado;

    botaoEnviar.disabled = true;
    mensagemFormulario.textContent = "Enviando...";
    try {
        const doacao = await ipawz.post("/doacoes", dados);
        if (doacao.pix) {
            mensagemFormulario.textContent = "";
            mostrarPix(doacao);
            return;
        }
        mensagemFormulario.textContent = "Doação registrada! A instituição vai entrar em contato. Obrigado por ajudar 🐾";
        formDoacao.reset();
        preencherDadosDoUsuario();
        ipawz.aviso("Doação registrada com sucesso!", "sucesso");
    } catch (erro) {
        mensagemFormulario.textContent = erro.message;
    } finally {
        botaoEnviar.disabled = false;
    }
});

// Instituições recebem doações, mas não doam
const sessaoAtual = ipawz.obterSessao();
if (sessaoAtual && sessaoAtual.usuario.tipo === "pj") {
    document.querySelector(".grade-doacoes").innerHTML =
        '<p class="aviso-instituicao">Contas de instituição recebem doações, mas não fazem doações pela IPAWZ. Veja as que você recebeu em <a href="doacoes-recebidas.html">Doações recebidas</a>.</p>';
} else {
    carregarInstituicoes();
}
