/* =========================================================
   IPAWZ - PAINEL DO PIX
   Desenha o QR Code e o "Pix copia e cola" que o backend gerou.
   Usado na tela de doação e no histórico de doações.
   Precisa de: js/vendor/qrcode.js e js/api.js
   ========================================================= */
(function () {
    const moeda = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // dados = resposta do backend: { copiaECola, valor, recebedor, tipoChave, chave, identificador }
    function html(dados) {
        const qr = window.QRCodeIPAWZ.svg(dados.copiaECola, { tamanho: 220, rotulo: "QR Code do Pix" });
        return `
            <div class="painel-pix">
                <div class="qr-pix">${qr}</div>
                <div>
                    <p class="etiqueta-pix">PAGUE COM PIX</p>
                    <h3>${moeda(dados.valor)}</h3>
                    <dl class="dados-pix">
                        <dt>Para</dt><dd>${ipawz.esc(dados.recebedor)}</dd>
                        <dt>Chave</dt><dd>${ipawz.esc(dados.tipoChave)}: ${ipawz.esc(dados.chave)}</dd>
                        <dt>Identificador</dt><dd>${ipawz.esc(dados.identificador)}</dd>
                    </dl>
                    <label for="copia-e-cola-${ipawz.esc(dados.identificador)}">Pix copia e cola</label>
                    <textarea id="copia-e-cola-${ipawz.esc(dados.identificador)}" class="copia-e-cola" readonly>${ipawz.esc(dados.copiaECola)}</textarea>
                    <div class="acoes-pix">
                        <button class="botao-pix" type="button" data-copiar-pix>Copiar código Pix</button>
                    </div>
                </div>
                <ol class="passos-pix">
                    <li>Abra o app do seu banco e entre na área Pix.</li>
                    <li>Escolha <strong>Ler QR Code</strong> (ou <strong>Pix Copia e Cola</strong> e cole o código).</li>
                    <li>Confira se o nome da instituição e o valor estão certos e confirme.</li>
                </ol>
                <p class="nota-pix">O dinheiro vai direto para a conta da instituição: a IPAWZ não recebe nem guarda nenhum valor.
                Quando o Pix cair, a instituição confirma a doação${ipawz.obterSessao() ? " e ela aparece como confirmada no seu Histórico de doações" : ""}.</p>
            </div>`;
    }

    async function copiar(texto, botao) {
        try {
            await navigator.clipboard.writeText(texto);
        } catch {
            // navegador sem permissão para a área de transferência: seleciona o texto para copiar à mão
            const campo = botao.closest(".painel-pix").querySelector(".copia-e-cola");
            campo.focus();
            campo.select();
            const ok = document.execCommand && document.execCommand("copy");
            if (!ok) {
                ipawz.aviso("Selecione o código e copie com Ctrl+C.", "erro");
                return;
            }
        }
        const original = botao.textContent;
        botao.textContent = "Código copiado!";
        setTimeout(() => (botao.textContent = original), 2500);
    }

    // Coloca o painel dentro de "container" e liga o botão de copiar
    function mostrar(container, dados) {
        container.innerHTML = html(dados);
        container.querySelector("[data-copiar-pix]").addEventListener("click", (e) => copiar(dados.copiaECola, e.currentTarget));
    }

    window.ipawzPix = { mostrar, moeda };
})();
