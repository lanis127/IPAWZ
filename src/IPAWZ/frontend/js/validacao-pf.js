/* =========================================================
   IPAWZ - VALIDAÇÃO DA PESSOA FÍSICA (adotante / voluntário)
   POST /api/validacao/pf  (multipart: campos + "selfieDocumento")
   Depois de enviar, volta para onde a pessoa estava (?voltar=) ou para a home.
   ========================================================= */

const form = document.getElementById("form-validacao");
const botao = document.getElementById("botao-enviar");
const mensagem = document.getElementById("mensagem");
const campoExperiencia = document.getElementById("campo-experiencia");
const voltar = validacao.destinoSeguro(ipawz.parametroUrl("voltar"));

iniciarCamposArquivo();
validacao.limparDestaques(form);
validacao.aplicarMascara(form.cpf, "cpf");
validacao.aplicarMascara(form.cep, "cep");
validacao.buscarCep(form.cep, form);

// Descrição da experiência só aparece (e é obrigatória) quando a resposta é "Sim"
function atualizarExperiencia() {
    const sim = form.querySelector('input[name="experienciaAnimais"]:checked')?.value === "sim";
    campoExperiencia.hidden = !sim;
    form.experienciaDescricao.required = sim;
}
form.querySelectorAll('input[name="experienciaAnimais"]').forEach((r) => r.addEventListener("change", atualizarExperiencia));

// Preenche com o que já existe no perfil (cadastro, perfil ou validação anterior)
function preencher(perfil) {
    const campos = { cpf: "cpf", cep: "cep", rua: "rua", numero: "numero", complemento: "complemento", bairro: "bairro", cidade: "cidade", estado: "estado" };
    for (const [id, coluna] of Object.entries(campos)) {
        if (perfil[coluna]) form[id].value = perfil[coluna];
    }
    form.cpf.formatar();
    form.cep.formatar();
    if (perfil.experiencia_animais !== null && perfil.experiencia_animais !== undefined) {
        form.querySelector(`input[name="experienciaAnimais"][value="${perfil.experiencia_animais ? "sim" : "nao"}"]`).checked = true;
        form.experienciaDescricao.value = perfil.experiencia_descricao || "";
        atualizarExperiencia();
    }
    if (perfil.documentos && perfil.documentos.selfie_documento) {
        document.querySelector('[data-campo="selfieDocumento"]').marcarEnviado();
    }
    validacao.mostrarSituacao(perfil);
    if (perfil.validacao_enviada_em) botao.textContent = "Reenviar validação";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagem.textContent = "";
    if (!validacao.validarCampos(form)) {
        mensagem.textContent = "Preencha os campos destacados.";
        return;
    }

    const dados = new FormData(form);
    if (!form.selfieDocumento.files[0]) dados.delete("selfieDocumento");

    botao.disabled = true;
    try {
        const perfil = await ipawz.post("/validacao/pf", dados);
        ipawz.atualizarUsuario(perfil);
        ipawz.aviso("Validação enviada! Agora você já pode continuar. 🐾", "sucesso");
        setTimeout(() => (location.href = voltar || "home.html"), 1200);
    } catch (erro) {
        mensagem.textContent = erro.message;
        botao.disabled = false;
    }
});

(async () => {
    try {
        const perfil = await ipawz.get("/perfil");
        // Perfil "Simples" não precisa validar: oferece trocar de perfil
        if (!perfil.precisa_validar) {
            location.replace("selecao-tipo-usuario.html" + (voltar ? "?voltar=" + encodeURIComponent(voltar) : ""));
            return;
        }
        preencher(perfil);
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
})();
