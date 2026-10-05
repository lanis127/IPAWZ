// =====================================================
// DADOS DOS PETS
// =====================================================
//
// É AQUI que ficam as informações de cada pet.
//
// Para adicionar um novo pet no futuro:
// 1. Coloque a imagem dele na pasta "img".
// 2. Copie um dos objetos abaixo.
// 3. Altere nome, idade, espécie, sexo, faixa etária,
//    porte, temperamento e nome da imagem.
//
// Não é necessário criar um novo card no HTML.
// O JavaScript fará isso automaticamente.
// =====================================================

const pets = [

    {
        nome: "Duke",
        idade: "6 anos",
        especie: "cachorro",
        sexo: "macho",
        faixaEtaria: "adulto",
        porte: "grande",
        temperamento: "brincalhao",
        imagem: "img/duke.jpg",
        alt: "Duke, cachorro de 6 anos"
    },

    {
        nome: "Zoe",
        idade: "2 anos",
        especie: "cachorro",
        sexo: "femea",
        faixaEtaria: "jovem",
        porte: "medio",
        temperamento: "sociavel",
        imagem: "img/zoe.jpg",
        alt: "Zoe, cachorro de 2 anos"
    },

    {
        nome: "Nala",
        idade: "3 meses",
        especie: "gato",
        sexo: "femea",
        faixaEtaria: "filhote",
        porte: "pequeno",
        temperamento: "calmo",
        imagem: "img/nala.jpg",
        alt: "Nala, gata de 3 meses"
    },

    {
        nome: "Salém",
        idade: "5 anos",
        especie: "gato",
        sexo: "macho",
        faixaEtaria: "adulto",
        porte: "medio",
        temperamento: "independente",
        imagem: "img/salem.jpg",
        alt: "Salém, gato de 5 anos"
    },

    {
        nome: "Nazinha",
        idade: "7 anos",
        especie: "gato",
        sexo: "femea",
        faixaEtaria: "idoso",
        porte: "medio",
        temperamento: "calmo",
        imagem: "img/nazinha.jpg",
        alt: "Nazinha, gata de 7 anos"
    },

    {
        nome: "Pipoca",
        idade: "4 anos",
        especie: "cachorro",
        sexo: "femea",
        faixaEtaria: "adulto",
        porte: "pequeno",
        temperamento: "sociavel",
        imagem: "img/pipoca.jpg",
        alt: "Pipoca, cachorro de 4 anos"
    },

    {
        nome: "Loro",
        idade: "2 anos",
        especie: "passaro",
        sexo: "macho",
        faixaEtaria: "jovem",
        porte: "pequeno",
        temperamento: "sociavel",
        imagem: "img/loro.jpg",
        alt: "Loro, ave de 2 anos"
    },

    {
        nome: "Marley",
        idade: "4 meses",
        especie: "cachorro",
        sexo: "macho",
        faixaEtaria: "filhote",
        porte: "medio",
        temperamento: "brincalhao",
        imagem: "img/marley.jpg",
        alt: "Marley, cachorro de 4 meses"
    },

    {
        nome: "Nala",
        idade: "3 anos",
        especie: "gato",
        sexo: "femea",
        faixaEtaria: "adulto",
        porte: "medio",
        temperamento: "independente",
        imagem: "img/nala2.jpg",
        alt: "Nala, gata de 3 anos"
    }

];


// =====================================================
// ELEMENTOS DA LISTAGEM
// =====================================================

const listaPets = document.getElementById("listaPets");
const mensagemSemPets = document.getElementById("mensagemSemPets");


// =====================================================
// CRIAÇÃO DOS CARDS
// =====================================================

function mostrarPets(lista) {

    // Limpa os cards que estavam na tela.
    listaPets.innerHTML = "";

    // Esconde a mensagem de nenhum resultado.
    mensagemSemPets.hidden = true;


    // Se não houver pets, mostra a mensagem e encerra a função.
    if (lista.length === 0) {
        mensagemSemPets.hidden = false;
        return;
    }


    // Cria um card para cada pet da lista recebida.
    lista.forEach(function(pet) {

        const card = document.createElement("article");
        card.className = "card-pet";

        const imagem = document.createElement("img");
        imagem.src = pet.imagem;
        imagem.alt = pet.alt;

        const nome = document.createElement("div");
        nome.className = "nome-pet";
        nome.textContent = pet.nome.toUpperCase() + ", " + pet.idade.toUpperCase();

        const conhecer = document.createElement("a");
        conhecer.href = "#";
        conhecer.className = "conheca-mais";
        conhecer.textContent = "CONHEÇA MAIS";

        card.appendChild(imagem);
        card.appendChild(nome);
        card.appendChild(conhecer);

        listaPets.appendChild(card);

    });

}


// Mostra todos os pets assim que a página é carregada.
mostrarPets(pets);


// =====================================================
// ELEMENTOS DO FILTRO
// =====================================================

const abrirFiltro = document.getElementById("abrirFiltro");
const fecharFiltro = document.getElementById("fecharFiltro");
const painelFiltro = document.getElementById("painelFiltro");
const filtroOverlay = document.getElementById("filtroOverlay");
const formFiltro = document.getElementById("formFiltro");
const limparFiltros = document.getElementById("limparFiltros");


// =====================================================
// ABRIR O PAINEL DE FILTRO
// =====================================================

function abrirPainelFiltro() {

    painelFiltro.classList.add("aberto");
    filtroOverlay.classList.add("ativo");

    painelFiltro.setAttribute("aria-hidden", "false");
    abrirFiltro.setAttribute("aria-expanded", "true");

}


abrirFiltro.addEventListener("click", abrirPainelFiltro);


// =====================================================
// FECHAR O PAINEL DE FILTRO
// =====================================================

function fecharPainelFiltro() {

    painelFiltro.classList.remove("aberto");
    filtroOverlay.classList.remove("ativo");

    painelFiltro.setAttribute("aria-hidden", "true");
    abrirFiltro.setAttribute("aria-expanded", "false");

}


fecharFiltro.addEventListener("click", fecharPainelFiltro);
filtroOverlay.addEventListener("click", fecharPainelFiltro);


// =====================================================
// PEGAR A OPÇÃO SELECIONADA DE CADA CATEGORIA
// =====================================================

function pegarValorSelecionado(nomeDoCampo) {

    const opcaoSelecionada = document.querySelector(
        'input[name="' + nomeDoCampo + '"]:checked'
    );

    return opcaoSelecionada ? opcaoSelecionada.value : "indiferente";

}


// =====================================================
// VERIFICAR SE O PET COMBINA COM OS FILTROS
// =====================================================

function petCombinaComFiltro(pet, filtros) {

    // Se a opção for "indiferente", aquela característica
    // não será usada para eliminar o pet.
    const combinaEspecie =
        filtros.especie === "indiferente" || pet.especie === filtros.especie;

    const combinaSexo =
        filtros.sexo === "indiferente" || pet.sexo === filtros.sexo;

    const combinaFaixaEtaria =
        filtros.faixaEtaria === "indiferente" || pet.faixaEtaria === filtros.faixaEtaria;

    const combinaPorte =
        filtros.porte === "indiferente" || pet.porte === filtros.porte;

    const combinaTemperamento =
        filtros.temperamento === "indiferente" || pet.temperamento === filtros.temperamento;


    // O pet precisa combinar com TODAS as categorias escolhidas.
    return (
        combinaEspecie &&
        combinaSexo &&
        combinaFaixaEtaria &&
        combinaPorte &&
        combinaTemperamento
    );

}


// =====================================================
// APLICAR OS FILTROS
// =====================================================

formFiltro.addEventListener("submit", function(event) {

    // Impede o formulário de recarregar a página.
    event.preventDefault();


    // Guarda as escolhas feitas pelo usuário.
    const filtros = {
        especie: pegarValorSelecionado("especie"),
        sexo: pegarValorSelecionado("sexo"),
        faixaEtaria: pegarValorSelecionado("faixaEtaria"),
        porte: pegarValorSelecionado("porte"),
        temperamento: pegarValorSelecionado("temperamento")
    };


    // Cria uma nova lista somente com os pets que combinam.
    const petsFiltrados = pets.filter(function(pet) {
        return petCombinaComFiltro(pet, filtros);
    });


    // Atualiza os cards da tela.
    mostrarPets(petsFiltrados);


    // Fecha o painel depois de aplicar o filtro.
    fecharPainelFiltro();


    // Volta para o início da área de pets.
    document.querySelector(".pagina-adocao").scrollIntoView({
        behavior: "smooth"
    });

    // =====================================================
// REMOVER TODOS OS FILTROS
// =====================================================

limparFiltros.addEventListener("click", function() {

    // Desmarca todas as opções selecionadas.
    const opcoesSelecionadas = document.querySelectorAll(
        '#formFiltro input[type="radio"]'
    );

    opcoesSelecionadas.forEach(function(opcao) {
        opcao.checked = false;
    });


    // Mostra novamente todos os pets.
    mostrarPets(pets);


    // Fecha o painel de filtro.
    fecharPainelFiltro();


    // Volta para o início da área de pets.
    document.querySelector(".pagina-adocao").scrollIntoView({
        behavior: "smooth"
    });

});

});

// =====================================================
// PAGINAÇÃO VISUAL
// =====================================================

const botoesPagina = document.querySelectorAll(".numero-pagina");
const botaoAnterior = document.getElementById("paginaAnterior");
const botaoProxima = document.getElementById("paginaProxima");

let paginaAtual = 1;
const totalPaginas = 5;


function mudarPagina(novaPagina) {

    if (novaPagina < 1 || novaPagina > totalPaginas) {
        return;
    }

    paginaAtual = novaPagina;

    botoesPagina.forEach(function(botao) {
        botao.classList.remove("ativa");
    });

    botoesPagina.forEach(function(botao) {

        if (Number(botao.dataset.pagina) === paginaAtual) {
            botao.classList.add("ativa");
        }

    });

    document.querySelector(".pagina-adocao").scrollIntoView({
        behavior: "smooth"
    });

}


botoesPagina.forEach(function(botao) {

    botao.addEventListener("click", function() {

        const paginaEscolhida = Number(botao.dataset.pagina);
        mudarPagina(paginaEscolhida);

    });

});


botaoAnterior.addEventListener("click", function() {
    mudarPagina(paginaAtual - 1);
});


botaoProxima.addEventListener("click", function() {
    mudarPagina(paginaAtual + 1);
});
