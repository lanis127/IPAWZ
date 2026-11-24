/* =========================================================
   IPAWZ - FORMULÁRIO DE ADOÇÃO
   Abre com formulario-adocao.html?pet=<id do pet>
   Envia: POST /api/adocoes { petId, respostas: [{ pergunta, resposta }] }
   ========================================================= */

const formulario = document.getElementById("formularioAdocao");
const mensagem = document.getElementById("mensagemSucesso");
const botaoEnviar = formulario.querySelector(".botao-enviar");
const petId = ipawz.parametroUrl("pet");

/* ---------- pet escolhido ---------- */
async function carregarPet() {
    if (!petId) {
        location.replace("listagem.html");
        return;
    }
    // Perfil sem adoção ou sem validação: manda para a etapa que falta e depois volta para cá
    if (ipawz.verificarPermissaoPF("adocao")) return;
    document.getElementById("link-voltar").href = `detalhes-pet.html?id=${encodeURIComponent(petId)}`;
    try {
        const pet = await ipawz.get("/pets/" + encodeURIComponent(petId));
        document.getElementById("pet-escolhido").textContent = `Pet: ${pet.nome}`;
        if (pet.status !== "disponivel") {
            mostrarMensagem("Este pet não está mais disponível para adoção.", true);
            botaoEnviar.disabled = true;
        }
    } catch (erro) {
        mostrarMensagem(erro.message, true);
        botaoEnviar.disabled = true;
    }
}

/* ---------- mostrar / esconder dados dos outros animais ---------- */
const dadosOutrosAnimais = document.getElementById("dadosOutrosAnimais");
document.getElementById("outrosAnimaisSim").addEventListener("change", () => dadosOutrosAnimais.classList.add("ativa"));
document.getElementById("outrosAnimaisNao").addEventListener("change", () => dadosOutrosAnimais.classList.remove("ativa"));

function mostrarMensagem(texto, erro) {
    mensagem.textContent = texto;
    mensagem.classList.toggle("erro", Boolean(erro));
    mensagem.style.display = "block";
    mensagem.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- junta cada pergunta com a resposta dada ---------- */
function coletarRespostas() {
    const respostas = [];
    formulario.querySelectorAll(".pergunta").forEach((bloco) => {
        const textoPergunta = bloco.querySelector(".pergunta-texto");
        if (!textoPergunta) return;

        const campos = bloco.querySelectorAll("input, textarea, select");
        const valores = [];
        campos.forEach((campo) => {
            if ((campo.type === "radio" || campo.type === "checkbox") && !campo.checked) return;
            if (campo.type === "checkbox") valores.push("Sim");
            else if (campo.value.trim()) valores.push(campo.value.trim());
        });
        if (valores.length) {
            respostas.push({
                pergunta: textoPergunta.textContent.replace(/\s+/g, " ").trim(),
                resposta: valores.join(", ")
            });
        }
    });
    return respostas;
}

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    botaoEnviar.disabled = true;
    try {
        const solicitacao = await ipawz.post("/adocoes", { petId: Number(petId), respostas: coletarRespostas() });
        mostrarMensagem("Formulário de adoção enviado com sucesso! 🐾 Abrindo suas solicitações...");
        formulario.querySelectorAll("input, textarea, button").forEach((campo) => (campo.disabled = true));
        // Vai direto para "Minhas solicitações de adoção", destacando a nova
        setTimeout(() => (location.href = `acompanhar-adocao.html?nova=${solicitacao.id}`), 900);
    } catch (erro) {
        if (ipawz.tratarBloqueio(erro, "adocao")) return;
        mostrarMensagem(erro.message, true);
        botaoEnviar.disabled = false;
    }
});

carregarPet();
