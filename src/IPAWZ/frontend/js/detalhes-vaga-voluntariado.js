/* =====================================================
   DADOS DA VAGA
   Para criar outra oportunidade, altere os valores deste objeto.
   Não é necessário procurar essas informações no HTML.
===================================================== */
const dadosVaga = {
    titulo: "CUIDADOS DIRETOS COM ANIMAIS",
    tipo: "Passeios e socialização - Meio período",
    localizacao: "Osasco, SP",
    data: "17/04/2027",
    instituicao: "Petz Mania",
    imagem: "img/vaga-voluntariado.jpg",
    textoAlternativoImagem: "Espaço de convivência dos animais da instituição",
    descricao: [
        "Estamos em busca de pessoas que gostem de animais e queiram contribuir com o bem-estar dos cães acolhidos pela instituição.",
        "O voluntário ajudará nos passeios, nas atividades de socialização e nos momentos de interação com os animais. Também poderá apoiar a equipe na organização dos espaços utilizados durante as atividades.",
        "Não é necessário ter experiência anterior, mas é importante ter responsabilidade, paciência, atenção às orientações da equipe e carinho no contato com os animais."
    ]
};

/* Preenche os elementos da página com as informações do objeto acima. */
function carregarDadosVaga() {
    document.getElementById("titulo-vaga").textContent = dadosVaga.titulo;
    document.getElementById("tipo-vaga").textContent = dadosVaga.tipo;
    document.getElementById("localizacao-vaga").innerHTML =
        '<span class="location-icon" aria-hidden="true">⌖</span> ' + dadosVaga.localizacao;
    document.getElementById("data-vaga").textContent = dadosVaga.data;
    document.getElementById("instituicao-vaga").textContent = dadosVaga.instituicao;

    const imagem = document.getElementById("imagem-vaga");
    imagem.src = dadosVaga.imagem;
    imagem.alt = dadosVaga.textoAlternativoImagem;

    const areaDescricao = document.getElementById("descricao-vaga");
    areaDescricao.replaceChildren();

    dadosVaga.descricao.forEach((paragrafo) => {
        const elementoParagrafo = document.createElement("p");
        elementoParagrafo.textContent = paragrafo;
        areaDescricao.appendChild(elementoParagrafo);
    });
}

/* Mensagem provisória do botão. Quando o formulário existir,
   substituiremos esta ação pela abertura ou exibição do formulário. */
function configurarBotaoCandidatura() {
    const botao = document.getElementById("btn-candidatar");
    const mensagem = document.getElementById("mensagem-candidatura");

    botao.addEventListener("click", () => {
        mensagem.hidden = false;
    });
}

/* Comportamento da sidebar compartilhada.
   Os elementos são opcionais porque a header/sidebar serão inseridas depois. */
function configurarSidebar() {
    const abrir = document.getElementById("openMenu");
    const fechar = document.getElementById("closeMenu");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("overlay");

    if (abrir && sidebar && overlay) {
        abrir.addEventListener("click", () => {
            sidebar.classList.add("active");
            overlay.classList.add("active");
        });
    }

    function fecharSidebar() {
        if (sidebar) sidebar.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
    }

    if (fechar) fechar.addEventListener("click", fecharSidebar);
    if (overlay) overlay.addEventListener("click", fecharSidebar);
}

/* Botão de voltar ao topo do footer compartilhado, se estiver presente. */
function configurarVoltarAoTopo() {
    const botaoTopo = document.querySelector(".back-top");

    if (botaoTopo) {
        botaoTopo.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

/* Inicializa os comportamentos quando o HTML terminar de carregar. */
document.addEventListener("DOMContentLoaded", () => {
    carregarDadosVaga();
    configurarBotaoCandidatura();
    configurarSidebar();
    configurarVoltarAoTopo();
});