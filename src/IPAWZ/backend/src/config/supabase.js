/* Conexão com o Supabase.
   - supabase: usa a chave service_role, só existe no servidor e ignora o RLS.
     Por isso TODA checagem de permissão é feita nas rotas.
   - clientePublico(): usa a chave anon, para login / recuperar senha. */
const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const faltando = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((n) => !process.env[n]);
if (faltando.length) {
    console.error(`\n[IPAWZ] Faltam variáveis no arquivo backend/.env: ${faltando.join(", ")}`);
    console.error("[IPAWZ] Copie .env.example para .env e preencha com os dados do Supabase.\n");
    process.exit(1);
}

const opcoesSemSessao = { auth: { persistSession: false, autoRefreshToken: false } };

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opcoesSemSessao);

// Um cliente novo por requisição, para a sessão de um usuário nunca vazar para outro
function clientePublico() {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opcoesSemSessao);
}

const BUCKET_IMAGENS = "imagens";        // público
const BUCKET_DOCUMENTOS = "documentos";  // privado (documentos de validação)

module.exports = { supabase, clientePublico, BUCKET_IMAGENS, BUCKET_DOCUMENTOS };
