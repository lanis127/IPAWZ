/* ======================================
   CARROSSEL INFINITO DE ONGS
====================================== */

const trilha = document.querySelector(".trilha-carrossel");

const btnDireita =
document.querySelector(".seta-direita");

const btnEsquerda =
document.querySelector(".seta-esquerda");

const areaIndicadores =
document.querySelector(".indicadores-carrossel");

const cardsOriginais =
Array.from(
    document.querySelectorAll(".card-ong")
);

/* ======================================
   CARDS VISÍVEIS
====================================== */

function obterCardsVisiveis() {

    if(window.innerWidth <= 600){
        return 1;
    }

    if(window.innerWidth <= 900){
        return 2;
    }

    return 4;

}

let cardsVisiveis = obterCardsVisiveis();

/* ======================================
   LIMPA INDICADORES
====================================== */

areaIndicadores.innerHTML = "";

/* ======================================
   CRIA CLONES
====================================== */

for(let i = cardsOriginais.length - cardsVisiveis; i < cardsOriginais.length; i++){

    const clone =
    cardsOriginais[i].cloneNode(true);

    clone.classList.add("clone");

    trilha.insertBefore(
        clone,
        trilha.firstChild
    );

}

for(let i = 0; i < cardsVisiveis; i++){

    const clone =
    cardsOriginais[i].cloneNode(true);

    clone.classList.add("clone");

    trilha.appendChild(clone);

}

/* ======================================
   LISTA FINAL DE CARDS
====================================== */

const cards =
document.querySelectorAll(".card-ong");

/* ======================================
   INDICADORES
====================================== */

cardsOriginais.forEach((_, indice)=>{

    const indicador =
    document.createElement("span");

    indicador.classList.add("indicador");

    if(indice === 0){
        indicador.classList.add("ativo");
    }

    indicador.addEventListener("click",()=>{

        indiceAtual =
        indice + cardsVisiveis;

        moverCarrossel();

    });

    areaIndicadores.appendChild(
        indicador
    );

});

/* ======================================
   POSIÇÃO INICIAL
====================================== */

let indiceAtual =
cardsVisiveis;

/* ======================================
   LARGURA DO CARD
====================================== */

function larguraCard(){

    const card =
    document.querySelector(".card-ong");

    const gap = 20;

    return card.offsetWidth + gap;

}

/* ======================================
   ATUALIZA INDICADORES
====================================== */

function atualizarIndicadores(){

    const indicadores =
    document.querySelectorAll(".indicador");

    indicadores.forEach(item => {

        item.classList.remove("ativo");

    });

    let indiceReal =
    (
        (indiceAtual - cardsVisiveis)
        % cardsOriginais.length
        + cardsOriginais.length
    )
    % cardsOriginais.length;

    indicadores[indiceReal]
    .classList.add("ativo");

}

/* ======================================
   MOVE CARROSSEL
====================================== */

function moverCarrossel(){

    trilha.style.transition =
    "transform 0.5s ease";

    trilha.style.transform =
    `translateX(-${indiceAtual * larguraCard()}px)`;

    atualizarIndicadores();

}

/* ======================================
   POSIÇÃO INICIAL
====================================== */

window.addEventListener("load",()=>{

    trilha.style.transition =
    "none";

    trilha.style.transform =
    `translateX(-${indiceAtual * larguraCard()}px)`;

});

/* ======================================
   PRÓXIMO
====================================== */

btnDireita.addEventListener("click",()=>{

    indiceAtual++;

    moverCarrossel();

});

/* ======================================
   ANTERIOR
====================================== */

btnEsquerda.addEventListener("click",()=>{

    indiceAtual--;

    moverCarrossel();

});

/* ======================================
   LOOP INFINITO
====================================== */

trilha.addEventListener(
    "transitionend",
    ()=>{

        if(
            indiceAtual >=
            cardsOriginais.length +
            cardsVisiveis
        ){

            trilha.style.transition =
            "none";

            indiceAtual =
            cardsVisiveis;

            trilha.style.transform =
            `translateX(-${indiceAtual * larguraCard()}px)`;

        }

        if(
            indiceAtual <
            cardsVisiveis
        ){

            trilha.style.transition =
            "none";

            indiceAtual =
            cardsOriginais.length +
            cardsVisiveis - 1;

            trilha.style.transform =
            `translateX(-${indiceAtual * larguraCard()}px)`;

        }

        atualizarIndicadores();

    }
);

/* ======================================
   RESPONSIVO
====================================== */

window.addEventListener(
    "resize",
    ()=>{

        trilha.style.transition =
        "none";

        trilha.style.transform =
        `translateX(-${indiceAtual * larguraCard()}px)`;

    }
);