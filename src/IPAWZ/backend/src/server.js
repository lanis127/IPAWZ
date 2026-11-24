/* =========================================================
   IPAWZ - SERVIDOR
   Rode com: npm run dev   (dentro da pasta backend)
   Abre o site em http://localhost:3000 e a API em /api
   ========================================================= */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const express = require("express");
const cors = require("cors");

const { rotaNaoEncontrada, paginaNaoEncontrada, tratarErros } = require("./middlewares/erros");

const app = express();
const PORTA = Number(process.env.PORT) || 3000;
const PASTA_FRONTEND = path.join(__dirname, "..", "..", "frontend");

/* ---------- configurações gerais ---------- */
const origens = (process.env.CORS_ORIGENS || "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({
    origin: (origem, cb) => cb(null, !origem || origem === "null" || origens.includes(origem))
}));
app.use(express.json({ limit: "1mb" }));

/* ---------- API ---------- */
app.get("/api/saude", (req, res) => res.json({ ok: true, horario: new Date().toISOString() }));
// O que está ligado neste servidor (o site usa para mostrar ou esconder botões)
app.get("/api/config", (req, res) => res.json({ loginGoogle: process.env.GOOGLE_LOGIN_ATIVO === "true" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/perfil"));          // /api/perfil e /api/instituicoes
app.use("/api/validacao", require("./routes/validacao"));
app.use("/api/pets", require("./routes/pets"));
app.use("/api/adocoes", require("./routes/adocoes"));
app.use("/api", require("./routes/voluntariado"));    // /api/vagas e /api/candidaturas
app.use("/api/doacoes", require("./routes/doacoes"));
app.use("/api", rotaNaoEncontrada);

/* ---------- SITE (frontend) ---------- */
// http://localhost:3000 -> página inicial
app.get("/", (req, res) => res.redirect("/html/inicio.html"));
app.use(express.static(PASTA_FRONTEND));
app.use(paginaNaoEncontrada(PASTA_FRONTEND));

/* ---------- erros ---------- */
app.use(tratarErros);

app.listen(PORTA, () => {
    console.log(`\n🐾 IPAWZ rodando em http://localhost:${PORTA}`);
    console.log(`   API: http://localhost:${PORTA}/api/saude\n`);
});
