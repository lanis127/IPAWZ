const path = require("path");
const multer = require("multer");

// Rota /api que não existe
function rotaNaoEncontrada(req, res) {
    res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Página do site que não existe -> tela de erro 404
function paginaNaoEncontrada(pastaFrontend) {
    return (req, res) => {
        // Fora de /html/ os caminhos relativos (../css) da página quebrariam: redireciona
        if (!req.path.startsWith("/html/")) return res.redirect("/html/erro-404.html");
        res.status(404).sendFile(path.join(pastaFrontend, "html", "erro-404.html"));
    };
}

// Todo erro lançado nas rotas termina aqui (Express 5 captura erros de funções async)
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
    if (erro instanceof multer.MulterError) {
        const mensagem = erro.code === "LIMIT_FILE_SIZE" ? "A imagem pode ter no máximo 5 MB." : "Erro no envio do arquivo.";
        return res.status(400).json({ erro: mensagem });
    }
    if (erro.type === "entity.parse.failed") {
        return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
    }

    const status = erro.status || 500;
    if (status >= 500) console.error("[Erro]", erro);

    res.status(status).json({
        erro: status >= 500 && !erro.status ? "Erro interno no servidor." : erro.message,
        ...(erro.codigo ? { codigo: erro.codigo } : {}),
        ...(erro.detalhes ? { detalhes: erro.detalhes } : {})
    });
}

module.exports = { rotaNaoEncontrada, paginaNaoEncontrada, tratarErros };
