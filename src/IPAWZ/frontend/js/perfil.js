/* =========================================================
   IPAWZ - PERFIL (pessoa física e instituição)
   As duas telas usam este arquivo. Os ids dos campos são os
   mesmos nomes que a API espera (exceto os do MAPA abaixo).
   GET /api/perfil  |  PUT /api/perfil  |  POST /api/perfil/foto
   ========================================================= */

const tipoPerfil = document.body.dataset.tipoPerfil; // "pf" | "pj"
const mensagem = document.getElementById("mensagem");
const btnEditar = document.getElementById("btnEditar");
const btnSalvar = document.getElementById("btnSalvar");

// campo na tela (id) -> coluna no banco
const CAMPOS = tipoPerfil === "pj"
    ? { razaoSocial: "razao_social", nomeFantasia: "nome", cnpj: "cnpj", telefone: "telefone", tipoInstituicao: "tipo_instituicao", email: "email" }
    : { nome: "nome", dataNascimento: "data_nascimento", telefone: "telefone", cpf: "cpf", email: "email" };
Object.assign(CAMPOS, { rua: "rua", numero: "numero", bairro: "bairro", cidade: "cidade", complemento: "complemento", cep: "cep", uf: "estado" });

// campo na tela (id) -> nome esperado pela API no PUT
const NOME_NA_API = { uf: "estado" };

const NOMES_TIPO = { simples: "Usuário Simples", adotante: "Usuário Adotante", voluntario: "Usuário Voluntário", multifuncional: "Usuário Multifuncional" };
const NOMES_STATUS = { pendente: "Validação em análise", aprovado: "Conta validada ✓", rejeitado: "Validação recusada: reenvie os dados" };

// Não podem ser alterados por aqui
const SOMENTE_LEITURA = ["email", "cnpj"];

let perfil = null;

/* ---------- máscaras ---------- */
const mascaras = {
    cpf: (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
    cnpj: (d) => d.slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"),
    cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2"),
    telefone: (d) => {
        d = d.slice(0, 11);
        if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
        if (d.length > 6) return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
        if (d.length > 2) return d.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
        return d;
    }
};
const aplicarMascara = (id, valor) => (mascaras[id] ? mascaras[id](String(valor || "").replace(/\D/g, "")) : valor || "");

Object.keys(mascaras).forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener("input", () => (campo.value = aplicarMascara(id, campo.value)));
});

/* ---------- tela ---------- */
function bloquear(bloqueado) {
    Object.keys(CAMPOS).forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = bloqueado || SOMENTE_LEITURA.includes(id);
    });
    btnSalvar.disabled = bloqueado;
    btnEditar.textContent = bloqueado ? "Editar perfil" : "Cancelar edição";
}

function preencher() {
    Object.entries(CAMPOS).forEach(([id, coluna]) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = aplicarMascara(id, perfil[coluna]);
    });
    document.getElementById("nomeExibicao").textContent = perfil.nome;

    // Pessoa física: tipo de perfil escolhido e situação da validação
    const tipoPerfil = document.getElementById("tipoPerfil");
    if (tipoPerfil) {
        tipoPerfil.value = NOMES_TIPO[perfil.tipo_usuario] || "Não escolhido";
        const status = document.getElementById("statusValidacao");
        if (perfil.precisa_validar) {
            status.innerHTML = perfil.validacao_enviada_em
                ? NOMES_STATUS[perfil.status_validacao]
                : '<a href="validacao-pf.html">Validação pendente: clique para validar</a>';
            status.className = "status-validacao " + (perfil.validacao_enviada_em ? perfil.status_validacao : "falta");
        }
    }

    const imagem = document.getElementById("imagemPerfil");
    if (perfil.foto_url) {
        imagem.src = perfil.foto_url;
        imagem.hidden = false;
    }
}

function mostrarMensagem(texto, erro) {
    mensagem.textContent = texto;
    mensagem.classList.toggle("erro", Boolean(erro));
    mensagem.style.display = "block";
    clearTimeout(mostrarMensagem.timer);
    mostrarMensagem.timer = setTimeout(() => (mensagem.style.display = "none"), 4000);
}

/* ---------- ações ---------- */
btnEditar.addEventListener("click", () => {
    const editando = btnSalvar.disabled;
    if (!editando) preencher(); // cancelou: volta os dados salvos
    bloquear(!editando);
});

btnSalvar.addEventListener("click", async () => {
    const dados = {};
    Object.keys(CAMPOS).forEach((id) => {
        if (SOMENTE_LEITURA.includes(id)) return;
        const campo = document.getElementById(id);
        if (campo) dados[NOME_NA_API[id] || id] = campo.value;
    });

    btnSalvar.disabled = true;
    try {
        perfil = await ipawz.put("/perfil", dados);
        // mantém o nome do menu/header atualizado
        const sessao = ipawz.obterSessao();
        ipawz.salvarSessao({ ...sessao, usuario: perfil });
        preencher();
        bloquear(true);
        mostrarMensagem("Informações salvas com sucesso! 🐾");
    } catch (erro) {
        btnSalvar.disabled = false;
        mostrarMensagem(erro.message, true);
    }
});

document.getElementById("fotoPerfil").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const dados = new FormData();
    dados.append("foto", arquivo);
    try {
        perfil = await ipawz.post("/perfil/foto", dados);
        preencher();
        ipawz.aviso("Foto atualizada!", "sucesso");
    } catch (erro) {
        ipawz.aviso(erro.message, "erro");
    }
});

(async () => {
    bloquear(true);
    try {
        perfil = await ipawz.get("/perfil");
        preencher();
    } catch (erro) {
        mostrarMensagem(erro.message, true);
    }
})();
