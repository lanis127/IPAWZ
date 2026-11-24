/* =========================================================
   IPAWZ - INSTITUIÇÕES E ONGS PARCEIRAS (dados reais)
   GET /api/instituicoes -> monta os cartões do carrossel.
   Clicar em uma ONG abre os Tipos de Doação com ela já escolhida.
   ========================================================= */

(async function () {
    const trilha = document.querySelector(".trilha-carrossel");
    if (!trilha) return;

    function cartao(ong) {
        const esc = ipawz.esc;
        const local = [ong.cidade, ong.estado].filter(Boolean).join(" - ");
        const texto = ong.descricao || `${ong.tipo_instituicao || "Instituição"}${local ? " em " + local : ""} que precisa da sua ajuda para cuidar dos animais.`;
        const imagem = ong.foto_url
            ? `<img src="${esc(ong.foto_url)}" alt="Logo de ${esc(ong.nome)}">`
            : `<div class="ong-sem-foto" aria-hidden="true"><img src="../assets/logo/foot-print.png" alt=""></div>`;
        return `
            <a class="card-ong" href="tipos-doacao.html?instituicao=${encodeURIComponent(ong.id)}" title="Doar para ${esc(ong.nome)}">
                ${imagem}
                <div class="conteudo-card">
                    <h3>${esc(ong.nome)}${ong.status_validacao === "aprovado" ? ' <span class="selo-verificada" title="Instituição verificada">✓</span>' : ""}</h3>
                    <p>${esc(texto)}</p>
                    <span class="card-ong-acao">Doar para esta ONG →</span>
                </div>
            </a>`;
    }

    try {
        const ongs = await ipawz.get("/instituicoes");
        if (!ongs.length) {
            trilha.innerHTML = '<p class="ipz-estado ongs-vazio">Nenhuma instituição cadastrada ainda.</p>';
            document.querySelectorAll(".seta-carrossel").forEach((b) => (b.hidden = true));
            return;
        }
        trilha.innerHTML = ongs.map(cartao).join("");
        iniciarCarrossel();
    } catch (erro) {
        trilha.innerHTML = `<p class="ipz-estado ongs-vazio">${ipawz.esc(erro.message)}</p>`;
        document.querySelectorAll(".seta-carrossel").forEach((b) => (b.hidden = true));
    }
})();
