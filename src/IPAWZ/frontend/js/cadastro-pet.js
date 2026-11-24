/* =========================================================
   IPAWZ - CADASTRO / EDIÇÃO DE PET
   cadastro-pet.html          -> cadastra um pet novo
   cadastro-pet.html?id=12    -> edita o pet 12 (só o dono)
   Pessoa física e instituição usam esta mesma tela.
   ========================================================= */

const form = document.getElementById("form-pet");
const botao = document.getElementById("botao-cadastro");
const mensagem = document.getElementById("mensagem-form");
const campoFoto = document.getElementById("fotoPet");
const preview = document.getElementById("preview");
const textoFoto = document.getElementById("textoFoto");
const idEdicao = ipawz.parametroUrl("id");
const sessao = ipawz.obterSessao();

/* ---------- pré-visualização da foto ---------- */
campoFoto.addEventListener("change", () => {
    const arquivo = campoFoto.files[0];
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) {
        ipawz.aviso("A foto pode ter no máximo 5 MB.", "erro");
        campoFoto.value = "";
        return;
    }
    preview.src = URL.createObjectURL(arquivo);
    preview.hidden = false;
    textoFoto.textContent = "CLIQUE PARA TROCAR A FOTO";
});

/* ---------- dados do responsável (vêm do perfil) ---------- */
function preencherResponsavel(usuario) {
    document.getElementById("nomeResponsavel").value = usuario.nome || "";
    document.getElementById("emailResponsavel").value = usuario.email || "";
    document.getElementById("telefoneResponsavel").value = usuario.telefone || "";
    if (!form.cidade.value) form.cidade.value = usuario.cidade || "";
    if (!form.uf.value) form.uf.value = usuario.estado || "";
}

/* ---------- modo edição ---------- */
const simNao = (valor) => (valor === true ? "sim" : valor === false ? "nao" : "");

async function carregarParaEdicao() {
    const pet = await ipawz.get("/pets/" + encodeURIComponent(idEdicao));
    if (!pet.dono || pet.dono.id !== sessao.usuario.id) {
        location.replace("meus-pets.html");
        return;
    }
    document.title = `Editar ${pet.nome} | IPAWZ`;
    document.getElementById("titulo-cadastro").textContent = `Editando o cadastro de ${pet.nome}`;
    botao.textContent = "Salvar alterações";

    form.nome.value = pet.nome;
    form.porte.value = pet.porte;
    form.sexo.value = pet.sexo;
    form.idade.value = pet.idade;
    form.faixaEtaria.value = pet.faixa_etaria;
    form.especie.value = pet.especie;
    form.vacinado.value = simNao(pet.vacinado);
    form.castrado.value = simNao(pet.castrado);
    form.temperamento.value = pet.temperamento || "";
    form.sociavelPets.value = simNao(pet.sociavel_pets);
    form.sociavelPessoas.value = simNao(pet.sociavel_pessoas);
    form.doenca.value = pet.doenca || "";
    form.descricao.value = pet.descricao || "";
    form.cidade.value = pet.cidade || "";
    form.uf.value = pet.uf || "";
    if (pet.foto_url) {
        preview.src = pet.foto_url;
        preview.hidden = false;
        textoFoto.textContent = "CLIQUE PARA TROCAR A FOTO";
    }
}

/* ---------- envio ---------- */
function validar() {
    let ok = true;
    form.querySelectorAll("[required]").forEach((campo) => {
        const vazio = !campo.value.trim();
        campo.classList.toggle("campo-invalido", vazio);
        if (vazio) ok = false;
    });
    return ok;
}

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";
    if (!validar()) {
        mensagem.textContent = "Preencha os campos destacados.";
        return;
    }
    if (!idEdicao && !campoFoto.files[0]) {
        mensagem.textContent = "Anexe uma foto do pet para ele aparecer na listagem.";
        return;
    }

    // FormData leva os campos com "name" + a foto (multipart/form-data)
    const dados = new FormData(form);
    if (!campoFoto.files[0]) dados.delete("foto");

    botao.disabled = true;
    try {
        const pet = idEdicao
            ? await ipawz.put("/pets/" + encodeURIComponent(idEdicao), dados)
            : await ipawz.post("/pets", dados);
        ipawz.aviso(idEdicao ? "Cadastro atualizado!" : "Pet cadastrado com sucesso! 🐾", "sucesso");
        setTimeout(() => (location.href = `detalhes-pet.html?id=${pet.id}`), 1200);
    } catch (erro) {
        mensagem.textContent = erro.message;
        botao.disabled = false;
    }
});

/* ---------- início ---------- */
(async () => {
    if (!sessao) return; // layout.js já mandou para o login
    try {
        if (idEdicao) await carregarParaEdicao();
        const perfil = await ipawz.get("/perfil");
        preencherResponsavel(perfil);
    } catch (erro) {
        preencherResponsavel(sessao.usuario);
        mensagem.textContent = erro.message;
    }
})();
