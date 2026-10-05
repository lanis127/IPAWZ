// =====================================================
// PEGANDO OS ELEMENTOS DA PAGINAÇÃO
// =====================================================

// Seleciona todos os números das páginas.
const botoesPagina = document.querySelectorAll(".numero-pagina");

// Seleciona o botão da página anterior.
const botaoAnterior = document.getElementById("paginaAnterior");

// Seleciona o botão da próxima página.
const botaoProxima = document.getElementById("paginaProxima");


// =====================================================
// PÁGINA ATUAL
// =====================================================

// Começamos na página 1.
let paginaAtual = 1;

// Número total de páginas.
const totalPaginas = 5;


// =====================================================
// FUNÇÃO PARA ALTERAR A PÁGINA
// =====================================================

function mudarPagina(novaPagina) {

    // Impede que a página seja menor que 1
    // ou maior que 5.
    if (novaPagina < 1 || novaPagina > totalPaginas) {
        return;
    }

    // Atualiza o número da página atual.
    paginaAtual = novaPagina;


    // Remove a classe "ativa" de todos os números.
    botoesPagina.forEach(function(botao) {
        botao.classList.remove("ativa");
    });


    // Adiciona a classe "ativa" ao número atual.
    botoesPagina.forEach(function(botao) {

        if (Number(botao.dataset.pagina) === paginaAtual) {
            botao.classList.add("ativa");
        }

    });


    // Volta para o início da área de pets.
    document.querySelector(".pagina-adocao").scrollIntoView({
        behavior: "smooth"
    });
}


// =====================================================
// CLIQUE NOS NÚMEROS DAS PÁGINAS
// =====================================================

botoesPagina.forEach(function(botao) {

    botao.addEventListener("click", function() {

        // Pega o número da página clicada.
        const paginaEscolhida = Number(botao.dataset.pagina);

        // Muda para a página escolhida.
        mudarPagina(paginaEscolhida);

    });

});


// =====================================================
// BOTÃO "PÁGINA ANTERIOR"
// =====================================================

botaoAnterior.addEventListener("click", function() {

    mudarPagina(paginaAtual - 1);

});


// =====================================================
// BOTÃO "PRÓXIMA PÁGINA"
// =====================================================

botaoProxima.addEventListener("click", function() {

    mudarPagina(paginaAtual + 1);

});