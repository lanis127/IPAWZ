/* Teste rápido: confere se o .env está certo e se as tabelas existem.
   Rode com: npm run verificar */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { supabase, BUCKET_IMAGENS, BUCKET_DOCUMENTOS } = require("./config/supabase");
const { testarConexao } = require("./services/email");

const TABELAS = ["perfis", "pets", "solicitacoes_adocao", "vagas", "candidaturas", "doacoes", "codigos_senha"];

(async () => {
    let tudoCerto = true;

    for (const tabela of TABELAS) {
        const { error } = await supabase.from(tabela).select("*", { count: "exact", head: true });
        if (error) {
            tudoCerto = false;
            console.log(`✗ tabela ${tabela}: ${error.message}`);
        } else {
            console.log(`✓ tabela ${tabela}`);
        }
    }

    // colunas novas da migração 002
    const { error: erroColunas } = await supabase.from("perfis").select("tipo_usuario, status_validacao, validacao_enviada_em", { head: true });
    if (erroColunas) {
        tudoCerto = false;
        console.log("✗ colunas de validação em perfis: rode database/migracao-002.sql");
    } else {
        console.log("✓ colunas de validação em perfis");
    }

    // colunas da migração 003 (Pix)
    const { error: erroPix } = await supabase.from("perfis").select("pix_tipo_chave, pix_chave", { head: true });
    if (erroPix) {
        tudoCerto = false;
        console.log("✗ colunas de Pix em perfis: rode database/migracao-003-pix.sql");
    } else {
        console.log("✓ colunas de Pix em perfis");
    }

    for (const [nome, publico] of [[BUCKET_IMAGENS, true], [BUCKET_DOCUMENTOS, false]]) {
        const { data: bucket, error: erroBucket } = await supabase.storage.getBucket(nome);
        if (erroBucket || !bucket) {
            tudoCerto = false;
            console.log(`✗ bucket "${nome}" não encontrado`);
        } else if (bucket.public !== publico) {
            tudoCerto = false;
            console.log(`✗ bucket "${nome}" deveria ser ${publico ? "público" : "PRIVADO"}`);
        } else {
            console.log(`✓ bucket "${nome}" (${publico ? "público" : "privado"})`);
        }
    }

    const email = await testarConexao();
    console.log(`${email.ok ? "✓" : "!"} e-mail: ${email.mensagem}`);
    const google = process.env.GOOGLE_LOGIN_ATIVO === "true";
    console.log(`${google ? "✓" : "!"} login com Google: ${google ? "ligado" : "desligado (GOOGLE_LOGIN_ATIVO=false)"}`);

    console.log(tudoCerto
        ? "\nTudo certo! Rode: npm run dev"
        : "\nAlgo faltou. Rode database/schema.sql (banco novo) ou as migrações 002 e 003-pix (banco antigo) no SQL Editor e confira o .env.");
    process.exit(tudoCerto ? 0 : 1);
})();
