/* =========================================================
   IPAWZ - CHAVE PIX DA INSTITUIÇÃO
   PUT /api/perfil/pix    { tipoChave, chave }
   DELETE /api/perfil/pix
   ========================================================= */
const formPix = document.getElementById("form-pix");
const campoTipo = document.getElementById("tipoChave");
const campoChave = document.getElementById("chave");
const mensagemPix = document.getElementById("mensagem-pix");

const AJUDA = {
    cnpj: { dica: "Só os números ou com pontos, ex.: 12.345.678/0001-90", placeholder: "00.000.000/0000-00", modo: "numeric" },
    email: { dica: "O e-mail cadastrado como chave no banco.", placeholder: "doacoes@suaong.org", modo: "email" },
    telefone: { dica: "Celular com DDD, ex.: (11) 98765-4321", placeholder: "(11) 98765-4321", modo: "tel" },
    aleatoria: { dica: "Copie do app do banco: 32 letras e números com hífens.", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", modo: "text" },
    cpf: { dica: "Use CPF só se a conta da instituição estiver nesse CPF.", placeholder: "000.000.000-00", modo: "numeric" }
};
const NOME_TIPO = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Celular", aleatoria: "Chave aleatória" };

function chaveFormatada(tipo, chave) {
    if (tipo === "cpf") return chave.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (tipo === "cnpj") return chave.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    if (tipo === "telefone") return chave.replace(/^\+55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
    return chave;
}

function atualizarAjuda() {
    const ajuda = AJUDA[campoTipo.value];
    document.getElementById("dica-chave").textContent = ajuda.dica;
    campoChave.placeholder = ajuda.placeholder;
    campoChave.inputMode = ajuda.modo;
}
campoTipo.addEventListener("change", () => {
    atualizarAjuda();
    campoChave.value = "";
    campoChave.focus();
});

function mostrar(usuario) {
    const temChave = Boolean(usuario.pix_chave);
    document.getElementById("cartao-chave-atual").hidden = !temChave;
    document.getElementById("titulo-form-pix").textContent = temChave ? "Trocar chave Pix" : "Cadastrar chave Pix";
    if (temChave) {
        document.getElementById("tipo-chave-atual").textContent = NOME_TIPO[usuario.pix_tipo_chave] || "";
        document.getElementById("valor-chave-atual").textContent = chaveFormatada(usuario.pix_tipo_chave, usuario.pix_chave);
    }

    const situacao = document.getElementById("situacao-pix");
    situacao.hidden = false;
    if (!temChave) {
        situacao.className = "situacao-pix alerta";
        situacao.textContent = "Sua instituição ainda não recebe doações financeiras. Cadastre uma chave Pix abaixo.";
    } else if (usuario.status_validacao !== "aprovado") {
        situacao.className = "situacao-pix alerta";
        situacao.textContent = "Chave salva. Ela começa a aparecer para os doadores assim que a equipe IPAWZ aprovar os documentos da instituição.";
    } else {
        situacao.className = "situacao-pix ok";
        situacao.textContent = "Tudo certo: os doadores já podem doar para vocês por Pix.";
    }
}

formPix.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagemPix.className = "mensagem-pix";
    if (!campoChave.value.trim()) {
        mensagemPix.classList.add("erro");
        mensagemPix.textContent = "Informe a chave Pix.";
        campoChave.focus();
        return;
    }
    const botao = document.getElementById("salvar-chave");
    botao.disabled = true;
    mensagemPix.textContent = "Salvando...";
    try {
        const usuario = await ipawz.put("/perfil/pix", { tipoChave: campoTipo.value, chave: campoChave.value });
        ipawz.atualizarUsuario(usuario);
        mostrar(usuario);
        formPix.reset();
        atualizarAjuda();
        mensagemPix.classList.add("ok");
        mensagemPix.textContent = "Chave Pix salva! 🐾";
    } catch (erro) {
        mensagemPix.classList.add("erro");
        mensagemPix.textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
});

document.getElementById("remover-chave").addEventListener("click", async () => {
    // confirmação na própria página (sem window.confirm)
    const botao = document.getElementById("remover-chave");
    if (botao.dataset.confirmar !== "sim") {
        botao.dataset.confirmar = "sim";
        botao.textContent = "Clique de novo para remover";
        setTimeout(() => { botao.dataset.confirmar = ""; botao.textContent = "Remover chave"; }, 4000);
        return;
    }
    try {
        const usuario = await ipawz.delete("/perfil/pix");
        ipawz.atualizarUsuario(usuario);
        mostrar(usuario);
        ipawz.aviso("Chave Pix removida. A doação financeira fica indisponível para sua instituição.", "sucesso");
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    } finally {
        botao.dataset.confirmar = "";
        botao.textContent = "Remover chave";
    }
});

atualizarAjuda();
(async () => {
    try {
        mostrar(await ipawz.get("/perfil"));
    } catch (erro) {
        mensagemPix.className = "mensagem-pix erro";
        mensagemPix.textContent = erro.message;
    }
})();
