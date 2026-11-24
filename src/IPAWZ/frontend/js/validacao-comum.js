/* =========================================================
   IPAWZ - FUNÇÕES COMUNS DAS TELAS DE VALIDAÇÃO (PF e instituição)
   ========================================================= */

window.validacao = (function () {
    const mascaras = {
        cpf: (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
        cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")
    };

    function aplicarMascara(campo, tipo) {
        if (!campo) return;
        const formatar = () => (campo.value = mascaras[tipo](campo.value.replace(/\D/g, "")));
        campo.addEventListener("input", formatar);
        campo.formatar = formatar;
    }

    // Busca o endereço pelo CEP (serviço público ViaCEP). Se falhar, a pessoa digita.
    function buscarCep(campoCep, form) {
        campoCep.addEventListener("blur", async () => {
            const cep = campoCep.value.replace(/\D/g, "");
            if (cep.length !== 8) return;
            try {
                const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const dados = await resposta.json();
                if (dados.erro) return ipawz.aviso("CEP não encontrado. Confira os números.", "erro");
                if (!form.rua.value) form.rua.value = dados.logradouro || "";
                if (!form.bairro.value) form.bairro.value = dados.bairro || "";
                form.cidade.value = dados.localidade || form.cidade.value;
                form.estado.value = dados.uf || form.estado.value;
                form.numero.focus();
            } catch (erro) {
                // sem internet ou serviço fora do ar: segue com preenchimento manual
            }
        });
    }

    // Faixa com a situação da validação já enviada
    function mostrarSituacao(perfil) {
        const caixa = document.getElementById("situacao");
        if (!perfil.validacao_enviada_em) return;
        const quando = ipawz.dataBR(perfil.validacao_enviada_em);
        const textos = {
            pendente: ["Documentos enviados em " + quando + " e em análise.", "Você pode reenviar se quiser corrigir algo; envie só o que mudou."],
            aprovado: ["Conta validada! ✓", "Seus dados foram aprovados. Se precisar atualizar algo, é só reenviar."],
            rejeitado: ["Validação recusada.", perfil.validacao_observacao || "Confira os dados e envie os documentos novamente."]
        };
        const [titulo, detalhe] = textos[perfil.status_validacao] || textos.pendente;
        caixa.className = "situacao " + perfil.status_validacao;
        caixa.innerHTML = `<div><strong>${ipawz.esc(titulo)}</strong>${ipawz.esc(detalhe)}</div>`;
        caixa.hidden = false;
    }

    // Marca campos obrigatórios vazios (inclusive arquivos ainda não enviados)
    function validarCampos(form) {
        let ok = true;
        form.querySelectorAll("[required]").forEach((campo) => {
            if (campo.type === "radio") {
                const marcado = form.querySelector(`input[name="${campo.name}"]:checked`);
                campo.closest(".campo").classList.toggle("campo-invalido", !marcado);
                if (!marcado) ok = false;
                return;
            }
            const vazio = !campo.value.trim();
            campo.classList.toggle("campo-invalido", vazio);
            if (vazio) ok = false;
        });
        form.querySelectorAll(".campo-arquivo").forEach((caixa) => {
            const falta = !caixa.querySelector("input").files[0] && caixa.dataset.enviado !== "true";
            caixa.classList.toggle("campo-invalido", falta);
            if (falta) ok = false;
        });
        return ok;
    }

    // Tira o destaque vermelho assim que a pessoa corrige o campo
    function limparDestaques(form) {
        const limpar = (e) => {
            e.target.classList.remove("campo-invalido");
            const bloco = e.target.closest(".campo, .campo-arquivo");
            if (bloco) bloco.classList.remove("campo-invalido");
            if (!form.querySelector(".campo-invalido")) document.getElementById("mensagem").textContent = "";
        };
        form.addEventListener("input", limpar);
        form.addEventListener("change", limpar);
    }

    const destinoSeguro = (pagina) => (pagina && /^[\w-]+\.html(\?.*)?$/.test(pagina) ? pagina : null);

    return { aplicarMascara, buscarCep, mostrarSituacao, validarCampos, limparDestaques, destinoSeguro };
})();
