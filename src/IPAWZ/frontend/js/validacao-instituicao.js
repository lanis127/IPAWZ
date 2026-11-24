/* =========================================================
   IPAWZ - VALIDAÇÃO DA INSTITUIÇÃO (obrigatória após o cadastro PJ)
   POST /api/validacao/instituicao  (upload múltiplo)
     cartaoCnpj, documentoRepresentante, selfieRepresentante, comprovanteEndereco
     + representanteNome, representanteCpf
   ========================================================= */

const form = document.getElementById("form-validacao");
const botao = document.getElementById("botao-enviar");
const mensagem = document.getElementById("mensagem");

// documentos já enviados (resposta da API) -> campo da tela
const ENVIADOS = {
    cartao_cnpj: "cartaoCnpj",
    documento_representante: "documentoRepresentante",
    selfie_representante: "selfieRepresentante",
    comprovante_endereco: "comprovanteEndereco"
};

iniciarCamposArquivo();
validacao.limparDestaques(form);
validacao.aplicarMascara(form.representanteCpf, "cpf");

function preencher(perfil) {
    form.representanteNome.value = perfil.representante_nome || "";
    form.representanteCpf.value = perfil.representante_cpf || "";
    form.representanteCpf.formatar();
    for (const [doc, campo] of Object.entries(ENVIADOS)) {
        if (perfil.documentos && perfil.documentos[doc]) document.querySelector(`[data-campo="${campo}"]`).marcarEnviado();
    }
    validacao.mostrarSituacao(perfil);
    if (perfil.validacao_enviada_em) botao.textContent = "Reenviar documentos";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagem.textContent = "";
    if (!validacao.validarCampos(form)) {
        mensagem.textContent = "Preencha os campos e envie os documentos destacados.";
        return;
    }

    const dados = new FormData(form);
    Object.values(ENVIADOS).forEach((campo) => {
        if (!form[campo].files[0]) dados.delete(campo); // reenvio: só o que mudou
    });

    botao.disabled = true;
    botao.textContent = "Enviando documentos...";
    try {
        const perfil = await ipawz.post("/validacao/instituicao", dados);
        ipawz.atualizarUsuario(perfil);
        ipawz.aviso("Documentos enviados! A equipe IPAWZ vai analisar. 🐾", "sucesso");
        setTimeout(() => (location.href = "home.html"), 1400);
    } catch (erro) {
        mensagem.textContent = erro.message;
        botao.disabled = false;
        botao.textContent = "Enviar documentos";
    }
});

(async () => {
    try {
        preencher(await ipawz.get("/perfil"));
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
})();
