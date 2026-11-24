/* =========================================================
   IPAWZ - CAMPO DE ENVIO DE ARQUIVO (com prévia)
   Usado nas telas de validação. Marcação esperada:

     <label class="campo-arquivo" data-tipos="imagem|documento" data-max-mb="8">
         <input type="file" name="...">
         <span class="arquivo-icone"></span>
         <span class="arquivo-texto">
             <strong>Título</strong><span>Descrição</span>
             <span class="arquivo-status"></span>
         </span>
     </label>

   Mostra o nome e o tamanho do arquivo escolhido, a prévia de imagens,
   aceita arrastar e soltar e recusa formatos/tamanhos inválidos.
   ========================================================= */

(function () {
    const TIPOS = {
        imagem: ["image/jpeg", "image/png", "image/webp"],
        documento: ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    };
    const iconeArquivo = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3-3 3 3"/></svg>';
    const iconePdf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><text x="7" y="18" font-size="6" fill="currentColor" stroke="none" font-family="Arial" font-weight="bold">PDF</text></svg>';

    const tamanho = (bytes) => (bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.ceil(bytes / 1024) + " KB");

    function iniciar(caixa) {
        const input = caixa.querySelector('input[type="file"]');
        const icone = caixa.querySelector(".arquivo-icone");
        const status = caixa.querySelector(".arquivo-status");
        const aceitos = TIPOS[caixa.dataset.tipos || "documento"];
        const maxMb = Number(caixa.dataset.maxMb || 8);
        const textoInicial = status.textContent;
        input.accept = aceitos.join(",");
        icone.innerHTML = iconeArquivo;

        function limpar(mensagemErro) {
            input.value = "";
            caixa.classList.remove("selecionado");
            icone.innerHTML = iconeArquivo;
            status.textContent = textoInicial;
            if (mensagemErro) ipawz.aviso(mensagemErro, "erro");
        }

        function mostrar(arquivo) {
            if (!arquivo) return limpar();
            if (!aceitos.includes(arquivo.type)) {
                return limpar(caixa.dataset.tipos === "imagem" ? "Envie uma foto (JPG, PNG ou WEBP)." : "Envie um PDF ou uma imagem (JPG, PNG ou WEBP).");
            }
            if (arquivo.size > maxMb * 1024 * 1024) return limpar(`O arquivo pode ter no máximo ${maxMb} MB.`);

            caixa.classList.add("selecionado");
            caixa.classList.remove("campo-invalido");
            status.textContent = `✓ ${arquivo.name} (${tamanho(arquivo.size)})`;
            if (arquivo.type.startsWith("image/")) {
                icone.innerHTML = `<img src="${URL.createObjectURL(arquivo)}" alt="Prévia do arquivo selecionado">`;
            } else {
                icone.innerHTML = iconePdf;
            }
        }

        input.addEventListener("change", () => mostrar(input.files[0]));

        // arrastar e soltar
        caixa.addEventListener("dragover", (e) => {
            e.preventDefault();
            caixa.classList.add("arrastando");
        });
        caixa.addEventListener("dragleave", () => caixa.classList.remove("arrastando"));
        caixa.addEventListener("drop", (e) => {
            e.preventDefault();
            caixa.classList.remove("arrastando");
            if (!e.dataTransfer.files[0]) return;
            const lista = new DataTransfer();
            lista.items.add(e.dataTransfer.files[0]);
            input.files = lista.files;
            mostrar(input.files[0]);
        });

        // permite a tela marcar "já enviado anteriormente"
        caixa.marcarEnviado = () => {
            if (caixa.classList.contains("selecionado")) return;
            status.textContent = "✓ Já enviado. Selecione outro arquivo só se quiser substituir.";
            caixa.dataset.enviado = "true";
        };
    }

    window.iniciarCamposArquivo = () => document.querySelectorAll(".campo-arquivo").forEach(iniciar);
})();
