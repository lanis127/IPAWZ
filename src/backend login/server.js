require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const autenticar = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ mensagem: "Backend do LOGIN funcionando." });
});

app.use("/api/auth", authRoutes);

app.get("/api/usuario", autenticar, (req, res) => {
    res.json({
        mensagem: "Rota protegida acessada com sucesso.",
        usuario: req.usuario
    });
});

async function iniciarServidor() {
    try {
        await pool.query("SELECT 1");
        console.log("MySQL conectado com sucesso.");

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (erro) {
        console.error("Não foi possível conectar ao MySQL:", erro.message);
    }
}

iniciarServidor();