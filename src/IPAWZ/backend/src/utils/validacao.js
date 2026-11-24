const { ErroHttp } = require("./erros");

const somenteDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const texto = (v) => (v === undefined || v === null ? "" : String(v).trim());
const vazioParaNull = (v) => (texto(v) === "" ? null : texto(v));

function exigirCampos(corpo, campos) {
    const faltando = campos.filter((c) => texto(corpo[c]) === "");
    if (faltando.length) {
        throw new ErroHttp(400, "Preencha todos os campos obrigatórios.", { faltando });
    }
}

function validarEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(email))) {
        throw new ErroHttp(400, "Informe um e-mail válido.");
    }
    return texto(email).toLowerCase();
}

function validarSenha(senha) {
    if (texto(senha).length < 6) throw new ErroHttp(400, "A senha precisa ter pelo menos 6 caracteres.");
    return String(senha);
}

function validarCnpj(valor) {
    const c = somenteDigitos(valor);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) throw new ErroHttp(400, "CNPJ inválido.");
    const calc = (base) => {
        const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const soma = base.split("").reduce((s, d, i) => s + Number(d) * pesos[i], 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    const d1 = calc(c.slice(0, 12));
    const d2 = calc(c.slice(0, 12) + d1);
    if (Number(c[12]) !== d1 || Number(c[13]) !== d2) throw new ErroHttp(400, "CNPJ inválido.");
    return c;
}

function validarCpf(valor) {
    const c = somenteDigitos(valor);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) throw new ErroHttp(400, "CPF inválido.");
    for (const t of [9, 10]) {
        const soma = c.slice(0, t).split("").reduce((s, d, i) => s + Number(d) * (t + 1 - i), 0);
        const dv = ((soma * 10) % 11) % 10;
        if (dv !== Number(c[t])) throw new ErroHttp(400, "CPF inválido.");
    }
    return c;
}

function validarOpcao(valor, opcoes, nomeCampo) {
    const v = texto(valor).toLowerCase();
    if (!opcoes.includes(v)) {
        throw new ErroHttp(400, `Valor inválido para "${nomeCampo}". Use: ${opcoes.join(", ")}.`);
    }
    return v;
}

// "sim"/"nao"/true/false -> boolean (ou null se vazio)
function simNao(valor) {
    const v = texto(valor).toLowerCase();
    if (v === "") return null;
    return ["sim", "true", "1", "s"].includes(v);
}

function idNumerico(valor) {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) throw new ErroHttp(400, "Identificador inválido.");
    return id;
}

module.exports = {
    somenteDigitos, texto, vazioParaNull, exigirCampos, validarEmail, validarSenha,
    validarCnpj, validarCpf, validarOpcao, simNao, idNumerico
};
