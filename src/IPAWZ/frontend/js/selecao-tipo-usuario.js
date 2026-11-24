/* =========================================================
   IPAWZ - SELEÇÃO DE PERFIL (pessoa física)
   2ª etapa do cadastro PF e também usada para trocar o perfil depois.
     Usuário Simples      -> cadastro finalizado (só doação)
     Adotante/Voluntário/Multifuncional -> validacao-pf.html (se ainda não validou)
   PUT /api/perfil/tipo-usuario
   Parâmetros opcionais: ?precisa=adocao|voluntariado&voltar=<página>
   ========================================================= */

const PERFIS = [
    { id: "simples", titulo: "Usuário Simples", permite: [true, false, false, false, false] },
    { id: "adotante", titulo: "Usuário Adotante", permite: [true, true, true, false, false] },
    { id: "voluntario", titulo: "Usuário Voluntário", permite: [true, false, false, true, true] },
    { id: "multifuncional", titulo: "Usuário Multifuncional", permite: [true, true, true, true, true] }
];
const ACOES = ["Realizar doação", "Solicitar adoção", "Acompanhar adoção", "Candidatar-se a voluntário", "Acompanhar candidatura"];
const SERVE_PARA = { adocao: ["adotante", "multifuncional"], voluntariado: ["voluntario", "multifuncional"] };

const iconeSim = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>';
const iconeNao = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const sessao = ipawz.obterSessao();
const atual = sessao && sessao.usuario.tipo_usuario;
const precisa = ipawz.parametroUrl("precisa");
const voltar = ipawz.parametroUrl("voltar");
const mensagem = document.getElementById("mensagem");

function montarCartoes() {
    document.getElementById("cartoes-perfil").innerHTML = PERFIS.map((p) => {
        const sugerido = precisa && SERVE_PARA[precisa] && SERVE_PARA[precisa].includes(p.id);
        return `
        <article class="cartao-perfil${p.id === atual ? " atual" : ""}${sugerido ? " sugerido" : ""}">
            ${p.id === atual ? '<span class="selo-atual">Perfil atual</span>' : ""}
            <h2>${p.titulo}</h2>
            <ul>
                ${ACOES.map((acao, i) => `
                    <li class="${p.permite[i] ? "sim" : "nao"}">
                        ${p.permite[i] ? iconeSim : iconeNao}
                        <span>${acao}<span class="sr-only">${p.permite[i] ? " (incluído)" : " (não incluído)"}</span></span>
                    </li>`).join("")}
            </ul>
            <button class="botao-confirmar" type="button" data-perfil="${p.id}">Confirmar</button>
        </article>`;
    }).join("");
}

function mostrarAviso() {
    if (!precisa || !SERVE_PARA[precisa]) return;
    const aviso = document.getElementById("aviso-precisa");
    aviso.textContent = precisa === "adocao"
        ? "Para solicitar adoção, escolha o perfil Adotante ou Multifuncional (destacados)."
        : "Para se candidatar a vagas, escolha o perfil Voluntário ou Multifuncional (destacados).";
    aviso.hidden = false;
}

const destinoSeguro = (pagina) => (pagina && /^[\w-]+\.html(\?.*)?$/.test(pagina) ? pagina : null);

document.getElementById("cartoes-perfil").addEventListener("click", async (e) => {
    const escolhido = e.target.dataset.perfil;
    if (!escolhido) return;

    const botoes = document.querySelectorAll(".botao-confirmar");
    botoes.forEach((b) => (b.disabled = true));
    mensagem.textContent = "";
    try {
        const usuario = await ipawz.put("/perfil/tipo-usuario", { tipoUsuario: escolhido });
        ipawz.atualizarUsuario(usuario);

        const depois = destinoSeguro(voltar);
        if (usuario.precisa_validar && !usuario.validacao_ok) {
            // Adotante / voluntário / multifuncional: falta a validação de pessoa física
            location.href = "validacao-pf.html" + (depois ? "?voltar=" + encodeURIComponent(depois) : "");
        } else {
            ipawz.aviso("Perfil confirmado! 🐾", "sucesso");
            setTimeout(() => (location.href = depois || "home.html"), 700);
        }
    } catch (erro) {
        mensagem.textContent = erro.message;
        botoes.forEach((b) => (b.disabled = false));
    }
});

montarCartoes();
mostrarAviso();
