/* =========================================================
   PIX - chave da instituição e código "copia e cola"

   O QR Code do Pix é só um texto no padrão "BR Code" do Banco
   Central (EMV QRCPS-MPM). Cada campo é escrito como:
       ID (2 dígitos) + TAMANHO (2 dígitos) + VALOR
   e o texto termina com um CRC16 que o app do banco confere.

   Aqui geramos um Pix ESTÁTICO com valor: não precisa de banco,
   API nem credencial. O dinheiro vai direto para a chave da
   instituição. Em troca, a IPAWZ não fica sabendo sozinha que o
   pagamento caiu: quem confirma é a instituição.
   ========================================================= */
const { ErroHttp } = require("./erros");
const v = require("./validacao");

const TIPOS_CHAVE = ["cpf", "cnpj", "email", "telefone", "aleatoria"];

const NOME_TIPO_CHAVE = {
    cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave aleatória"
};

// Valida e deixa a chave no formato que o Pix exige
function normalizarChave(tipo, chave) {
    const t = v.validarOpcao(tipo, TIPOS_CHAVE, "tipo da chave Pix");
    const bruta = v.texto(chave);
    if (!bruta) throw new ErroHttp(400, "Informe a chave Pix.");

    if (t === "cpf") {
        try { return { tipo: t, chave: v.validarCpf(bruta) }; } catch { throw new ErroHttp(400, "Chave Pix inválida: CPF incorreto."); }
    }
    if (t === "cnpj") {
        try { return { tipo: t, chave: v.validarCnpj(bruta) }; } catch { throw new ErroHttp(400, "Chave Pix inválida: CNPJ incorreto."); }
    }
    if (t === "email") {
        let email;
        try { email = v.validarEmail(bruta); } catch { throw new ErroHttp(400, "Chave Pix inválida: e-mail incorreto."); }
        if (email.length > 77) throw new ErroHttp(400, "Chave Pix inválida: o e-mail pode ter no máximo 77 caracteres.");
        return { tipo: t, chave: email };
    }
    if (t === "telefone") {
        // Aceita "(11) 99999-9999", "11999999999" ou "+55 11 99999-9999" e guarda como +5511999999999
        let d = v.somenteDigitos(bruta);
        if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
        if (!/^[1-9]{2}\d{8,9}$/.test(d)) throw new ErroHttp(400, "Chave Pix inválida: use o celular com DDD, como (11) 99999-9999.");
        return { tipo: t, chave: "+55" + d };
    }
    // chave aleatória (EVP): um UUID de 36 caracteres
    const uuid = bruta.toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
        throw new ErroHttp(400, "Chave Pix inválida: a chave aleatória tem 32 letras e números separados por hífens.");
    }
    return { tipo: t, chave: uuid };
}

// Esconde parte da chave para mostrar na tela de doação (ex.: ***.456.789-**)
function mascararChave(tipo, chave) {
    if (!chave) return "";
    if (tipo === "cpf") return `***.${chave.slice(3, 6)}.${chave.slice(6, 9)}-**`;
    if (tipo === "telefone") return `(${chave.slice(3, 5)}) *****-${chave.slice(-4)}`;
    return chave; // CNPJ, e-mail e chave aleatória já são públicos de propósito
}

// Nome e cidade no BR Code: só letras sem acento, números e espaço
function textoSimples(valor, limite) {
    return String(valor || "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9 ]/g, " ")
        .replace(/\s+/g, " ").trim()
        .toUpperCase()
        .slice(0, limite)
        .trim();
}

function campo(id, valor) {
    const tamanho = String(valor.length).padStart(2, "0");
    if (valor.length > 99) throw new Error(`Campo ${id} do Pix passou de 99 caracteres.`);
    return id + tamanho + valor;
}

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido pelo BR Code
function crc16(texto) {
    let crc = 0xffff;
    for (let i = 0; i < texto.length; i++) {
        crc ^= texto.charCodeAt(i) << 8;
        for (let b = 0; b < 8; b++) {
            crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Monta o "Pix copia e cola".
 * @param {object} p
 * @param {string} p.chave      chave já normalizada
 * @param {string} p.nome       nome de quem recebe (até 25 caracteres)
 * @param {string} p.cidade     cidade de quem recebe (até 15 caracteres)
 * @param {number} p.valor      valor em reais
 * @param {string} p.txid       identificador da doação (letras e números, até 25)
 * @param {string} [p.mensagem] texto curto que alguns bancos mostram no comprovante
 */
function gerarCopiaECola({ chave, nome, cidade, valor, txid, mensagem }) {
    const gui = campo("00", "br.gov.bcb.pix");
    let conta = gui + campo("01", chave);
    const msg = textoSimples(mensagem, 40);
    if (msg && (conta + campo("02", msg)).length <= 99) conta += campo("02", msg);

    const id = String(txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

    const semCrc =
        campo("00", "01") +                               // versão do formato
        campo("26", conta) +                              // dados da conta Pix
        campo("52", "0000") +                             // categoria (não informada)
        campo("53", "986") +                              // moeda: real
        campo("54", Number(valor).toFixed(2)) +           // valor
        campo("58", "BR") +
        campo("59", textoSimples(nome, 25) || "INSTITUICAO") +
        campo("60", textoSimples(cidade, 15) || "BRASIL") +
        campo("62", campo("05", id)) +                    // identificador da transação
        "6304";                                           // o CRC entra aqui
    return semCrc + crc16(semCrc);
}

module.exports = { TIPOS_CHAVE, NOME_TIPO_CHAVE, normalizarChave, mascararChave, gerarCopiaECola, crc16, textoSimples };
