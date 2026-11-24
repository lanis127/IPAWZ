/* =========================================================
   IPAWZ - DETALHES DO PET
   Abre com detalhes-pet.html?id=<id do pet>
   ========================================================= */

const NOMES = {
    especie: { cachorro: "Cachorro", gato: "Gato", passaro: "Pássaro", outro: "Outro" },
    sexo: { macho: "Macho", femea: "Fêmea" },
    porte: { pequeno: "Pequeno", medio: "Médio", grande: "Grande" },
    temperamento: { calmo: "Calmo", brincalhao: "Brincalhão", agitado: "Agitado", sociavel: "Sociável", independente: "Independente" }
};

// Mostra "Sim / Não" com a caixinha certa marcada (layout do Figma)
function simNao(rotulo, valor) {
    const caixa = (marcado) => `<span class="checkbox${marcado ? " marcado" : ""}"></span>`;
    return `
        <div class="item-historico">
            <strong>${rotulo}:</strong>
            <div class="opcoes">
                <div class="opcao">${caixa(valor === true)} Sim</div>
                <div class="opcao">${caixa(valor === false)} Não</div>
            </div>
        </div>`;
}

function linha(rotulo, valor) {
    return valor ? `<p><strong>${rotulo}:</strong> ${ipawz.esc(valor)}</p>` : "";
}

async function carregarPet() {
    const id = ipawz.parametroUrl("id");
    const dados = document.getElementById("dados-pet");
    const botao = document.getElementById("botao-adocao");

    if (!id) {
        location.replace("listagem.html");
        return;
    }

    try {
        const pet = await ipawz.get("/pets/" + encodeURIComponent(id));

        document.title = `Conheça ${pet.nome} | IPAWZ`;
        document.getElementById("titulo-pet").textContent = `Conheça ${pet.nome}`;

        const foto = document.getElementById("foto-pet");
        foto.src = pet.foto_url || ipawz.FOTO_PADRAO;
        foto.alt = `Foto de ${pet.nome}`;

        dados.innerHTML = `
            ${linha("Nome", pet.nome)}
            ${linha("Espécie", NOMES.especie[pet.especie])}
            ${linha("Sexo", NOMES.sexo[pet.sexo])}
            ${linha("Idade", pet.idade)}
            ${linha("Porte", NOMES.porte[pet.porte])}
            ${linha("Temperamento", NOMES.temperamento[pet.temperamento])}
            ${linha("Localização", [pet.cidade, pet.uf].filter(Boolean).join(" - "))}
            <div class="historico">
                <div class="historico-titulo">HISTÓRICO VETERINÁRIO</div>
                ${simNao("Castração", pet.castrado)}
                ${simNao("Vacinas", pet.vacinado)}
                ${pet.doenca ? `<p class="anexo"><strong>Condição de saúde:</strong> ${ipawz.esc(pet.doenca)}</p>` : ""}
            </div>`;

        document.getElementById("descricao-pet").textContent = pet.descricao || "Sem descrição cadastrada.";

        if (pet.dono) {
            document.getElementById("area-responsavel").hidden = false;
            document.getElementById("responsavel-pet").textContent =
                `${pet.dono.nome}${pet.dono.cidade ? " - " + pet.dono.cidade + "/" + (pet.dono.estado || "") : ""}`;
        }

        const sessao = ipawz.obterSessao();
        if (pet.status !== "disponivel") {
            botao.textContent = pet.status === "adotado" ? "Já foi adotado" : "Indisponível";
            botao.classList.add("desativado");
        } else if (sessao && pet.dono && pet.dono.id === sessao.usuario.id) {
            botao.textContent = "Editar meu pet";
            botao.href = `cadastro-pet.html?id=${pet.id}`;
        } else if (sessao && sessao.usuario.tipo === "pj") {
            botao.textContent = "Adoção é feita por pessoa física";
            botao.classList.add("desativado");
        } else if (sessao && (!sessao.usuario.permissoes || !sessao.usuario.permissoes.adocao)) {
            // Usuário Simples: precisa trocar para Adotante/Multifuncional
            botao.textContent = "Ativar perfil adotante";
            botao.href = `selecao-tipo-usuario.html?precisa=adocao&voltar=${encodeURIComponent("formulario-adocao.html?pet=" + pet.id)}`;
        } else {
            // Sem login, o formulário manda para o login e depois volta
            botao.href = `formulario-adocao.html?pet=${pet.id}`;
        }
    } catch (erro) {
        dados.innerHTML = `<p class="ipz-estado">${ipawz.esc(erro.message)}</p>`;
        botao.classList.add("desativado");
    }
}

carregarPet();
