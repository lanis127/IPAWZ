/* Regras ligadas ao perfil do usuário, usadas em várias rotas e no site. */

// O que cada tipo de pessoa física pode fazer (igual aos cartões da tela "Seleção de perfil")
const PERMISSOES = {
    simples:        { doacao: true, adocao: false, voluntariado: false },
    adotante:       { doacao: true, adocao: true,  voluntariado: false },
    voluntario:     { doacao: true, adocao: false, voluntariado: true },
    multifuncional: { doacao: true, adocao: true,  voluntariado: true }
};
const TIPOS_USUARIO = Object.keys(PERMISSOES);

// Campos com caminhos de documentos: nunca saem do servidor
const CAMPOS_DOCUMENTOS = [
    "selfie_documento_path", "cartao_cnpj_path", "documento_representante_path",
    "selfie_representante_path", "comprovante_endereco_path"
];

function pode(perfil, acao) {
    return perfil.tipo === "pf" && Boolean(PERMISSOES[perfil.tipo_usuario] && PERMISSOES[perfil.tipo_usuario][acao]);
}

// PF adotante/voluntário/multifuncional e toda instituição precisam enviar documentos
function precisaValidar(perfil) {
    if (perfil.tipo === "pj") return true;
    return ["adotante", "voluntario", "multifuncional"].includes(perfil.tipo_usuario);
}

function validacaoEnviada(perfil) {
    return Boolean(perfil.validacao_enviada_em) && perfil.status_validacao !== "rejeitado";
}

// Próxima tela obrigatória do cadastro (ou null se o cadastro está completo)
function proximoPasso(perfil) {
    if (perfil.tipo === "pj" && !validacaoEnviada(perfil)) return "validacao-instituicao.html";
    if (perfil.tipo === "pf" && !perfil.tipo_usuario) return "selecao-tipo-usuario.html";
    return null;
}

// Perfil que pode ir para o navegador: sem caminhos de documentos, com resumo do que foi enviado
function perfilParaSite(perfil) {
    if (!perfil) return perfil;
    const copia = { ...perfil };
    const documentos = {};
    for (const campo of CAMPOS_DOCUMENTOS) {
        documentos[campo.replace("_path", "")] = Boolean(copia[campo]);
        delete copia[campo];
    }
    copia.documentos = documentos;
    copia.permissoes = copia.tipo === "pf" ? (PERMISSOES[copia.tipo_usuario] || null) : null;
    copia.precisa_validar = precisaValidar(perfil);
    copia.validacao_ok = validacaoEnviada(perfil);
    copia.proximo_passo = proximoPasso(perfil);
    return copia;
}

module.exports = { PERMISSOES, TIPOS_USUARIO, CAMPOS_DOCUMENTOS, pode, precisaValidar, validacaoEnviada, proximoPasso, perfilParaSite };
