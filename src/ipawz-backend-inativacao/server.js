require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));

app.get("/", (req, res) => res.json({ mensagem: "API do IPAWZ funcionando." }));
app.use((req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`API IPAWZ na porta ${PORT}`));
