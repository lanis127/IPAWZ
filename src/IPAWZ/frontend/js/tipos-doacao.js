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
        descricao: "Conte como pretende contribuir financeiramente.",
        campos: `
            <div class="campo">
                <label for="valor">Valor da doação (R$)</label>
                <input id="valor" name="valor" type="number" min="1" step="0.01" placeholder="Ex.: 50,00" required>
            </div>
            <div class="campo">
                <label for="metodo">Forma de contribuição</label>
                <select id="metodo" name="metodo" required>
                    <option value="">Selecione uma opção</option>
                    <option>PIX</option>
                    <option>Cartão de débito</option>
                    <option>Cartão de crédito</option>
                    <option>Outra forma</option>
                </select>
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

formDoacao.addEventListener("submit", (evento) => {
    evento.preventDefault();

    // Protótipo: os dados ainda não são enviados para um servidor.
    mensagemFormulario.textContent = "Formulário preenchido! A integração para registrar a doação será feita na etapa de backend.";
});

document.querySelector("#voltar-topo").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// MENU LATERAL (SIDEBAR)
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");

if (sidebar && overlay && openMenu && closeMenu) {
    openMenu.addEventListener("click", () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
    });

    closeMenu.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
}

// BOTÃO VOLTAR AO TOPO DO FOOTER
const botaoTopo = document.querySelector(".back-top");

if (botaoTopo) {
    botaoTopo.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}