/* =========================================================
   IPAWZ - CARROSSEL INFINITO DE ONGS (Home e Doação)
   O js/carrossel-ongs.js busca as instituições na API, monta os
   cartões e depois chama iniciarCarrossel().
   ========================================================= */

function iniciarCarrossel() {
    const trilha = document.querySelector(".trilha-carrossel");
    const btnDireita = document.querySelector(".seta-direita");
    const btnEsquerda = document.querySelector(".seta-esquerda");
    const areaIndicadores = document.querySelector(".indicadores-carrossel");
    const cardsOriginais = Array.from(trilha.querySelectorAll(".card-ong"));
    const GAP = 20;

    function obterCardsVisiveis() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 900) return 2;
        return 4;
    }
    const cardsVisiveis = obterCardsVisiveis();

    areaIndicadores.innerHTML = "";

    // Poucas instituições: mostra todas, sem setas nem movimento
    const precisaRolar = cardsOriginais.length > cardsVisiveis;
    btnDireita.hidden = !precisaRolar;
    btnEsquerda.hidden = !precisaRolar;
    trilha.classList.toggle("centralizada", !precisaRolar);
    if (!precisaRolar) return;

    // Clones no começo e no fim para o efeito de "loop infinito"
    for (let i = cardsOriginais.length - cardsVisiveis; i < cardsOriginais.length; i++) {
        const clone = cardsOriginais[i].cloneNode(true);
        clone.classList.add("clone");
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        trilha.insertBefore(clone, trilha.firstChild);
    }
    for (let i = 0; i < cardsVisiveis; i++) {
        const clone = cardsOriginais[i].cloneNode(true);
        clone.classList.add("clone");
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        trilha.appendChild(clone);
    }

    let indiceAtual = cardsVisiveis;
    const larguraCard = () => trilha.querySelector(".card-ong").offsetWidth + GAP;

    cardsOriginais.forEach((_, indice) => {
        const indicador = document.createElement("span");
        indicador.className = "indicador" + (indice === 0 ? " ativo" : "");
        indicador.addEventListener("click", () => {
            indiceAtual = indice + cardsVisiveis;
            mover();
        });
        areaIndicadores.appendChild(indicador);
    });

    function atualizarIndicadores() {
        const real = (((indiceAtual - cardsVisiveis) % cardsOriginais.length) + cardsOriginais.length) % cardsOriginais.length;
        areaIndicadores.querySelectorAll(".indicador").forEach((item, i) => item.classList.toggle("ativo", i === real));
    }

    function posicionar(animado) {
        trilha.style.transition = animado ? "transform 0.5s ease" : "none";
        trilha.style.transform = `translateX(-${indiceAtual * larguraCard()}px)`;
    }

    function mover() {
        posicionar(true);
        atualizarIndicadores();
    }

    posicionar(false);
    btnDireita.addEventListener("click", () => { indiceAtual++; mover(); });
    btnEsquerda.addEventListener("click", () => { indiceAtual--; mover(); });

    trilha.addEventListener("transitionend", () => {
        if (indiceAtual >= cardsOriginais.length + cardsVisiveis) {
            indiceAtual = cardsVisiveis;
            posicionar(false);
        }
        if (indiceAtual < cardsVisiveis) {
            indiceAtual = cardsOriginais.length + cardsVisiveis - 1;
            posicionar(false);
        }
        atualizarIndicadores();
    });
}
