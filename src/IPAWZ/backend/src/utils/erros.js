/* Erro com status HTTP. Lançar um ErroHttp em qualquer rota faz o
   middleware de erros responder { erro: "mensagem" } com esse status. */
class ErroHttp extends Error {
    // codigo: identificador para o site saber o que fazer (ex.: "VALIDACAO_NECESSARIA")
    constructor(status, mensagem, detalhes, codigo) {
        super(mensagem);
        this.status = status;
        this.detalhes = detalhes;
        this.codigo = codigo;
    }
}

// Converte erros do Supabase/Postgres em mensagens que fazem sentido na tela
function erroDoBanco(erro, mensagemPadrao = "Erro ao acessar o banco de dados.") {
    if (!erro) return null;
    if (erro.code === "23505") {
        if (/cnpj/i.test(erro.message)) return new ErroHttp(409, "Já existe uma instituição com este CNPJ.");
        if (/cpf/i.test(erro.message)) return new ErroHttp(409, "Já existe uma conta com este CPF.");
        if (/email/i.test(erro.message)) return new ErroHttp(409, "Este e-mail já está cadastrado.");
        return new ErroHttp(409, "Este registro já existe.");
    }
    if (erro.code === "23514") return new ErroHttp(400, "Algum campo tem um valor inválido.", erro.message);
    if (erro.code === "PGRST116") return new ErroHttp(404, "Registro não encontrado.");
    if (erro.code === "42P01") {
        return new ErroHttp(500, "Tabela não encontrada. Rode o arquivo database/schema.sql no Supabase.");
    }
    console.error("[Supabase]", erro);
    return new ErroHttp(500, mensagemPadrao);
}

// Atalho: se o Supabase devolveu erro, lança; se não, devolve os dados
function verificar({ data, error }, mensagemPadrao) {
    if (error) throw erroDoBanco(error, mensagemPadrao);
    return data;
}

// Igual ao verificar, mas devolve também o total (consultas com { count: "exact" })
verificar.comContagem = ({ data, error, count }, mensagemPadrao) => {
    if (error) throw erroDoBanco(error, mensagemPadrao);
    return { data, count: count || 0 };
};

module.exports = { ErroHttp, erroDoBanco, verificar };
