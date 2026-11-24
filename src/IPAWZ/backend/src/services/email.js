/* Envio de e-mails (código de redefinição de senha).

   Por que não usamos o e-mail do próprio Supabase?
   O servidor de e-mail padrão do Supabase só entrega para os e-mails da
   EQUIPE do projeto e tem limite de poucos envios por hora. Para qualquer
   outro usuário o e-mail simplesmente não chega.

   Há duas formas de enviar (o backend escolhe sozinho):

   1. API do Brevo (HTTPS) - use na HOSPEDAGEM.
      Render, Railway e outras hospedagens gratuitas bloqueiam o SMTP
      (portas 465/587), mas não bloqueiam HTTPS.
        BREVO_API_KEY=<chave de API do Brevo>
        EMAIL_REMETENTE="IPAWZ <pets.ipawz@gmail.com>"   (remetente confirmado no Brevo)

   2. SMTP com Nodemailer (ex.: Gmail do projeto) - funciona no seu computador.
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=465
        SMTP_USER=pets.ipawz@gmail.com
        SMTP_PASS=<senha de app de 16 letras>

   Se BREVO_API_KEY estiver preenchida, ela tem prioridade.
   Sem nenhum dos dois (desenvolvimento), o código aparece no terminal. */
const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_REMETENTE, BREVO_API_KEY } = process.env;
// BREVO_API_URL só existe para os testes automáticos; não precisa estar no .env
const BREVO_API_URL = (process.env.BREVO_API_URL || "https://api.brevo.com/v3").replace(/\/$/, "");

const usaBrevo = Boolean(BREVO_API_KEY);
const usaSmtp = !usaBrevo && Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const configurado = usaBrevo || usaSmtp;

const transporte = usaSmtp
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 465,
        secure: Number(SMTP_PORT || 465) === 465, // 465 = SSL; 587 = STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
    : null;

// "IPAWZ <pets.ipawz@gmail.com>" -> { name: "IPAWZ", email: "pets.ipawz@gmail.com" }
function remetente() {
    const texto = String(EMAIL_REMETENTE || SMTP_USER || "").trim();
    const partes = texto.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/);
    if (partes) return { name: partes[1].trim() || "IPAWZ", email: partes[2].trim() };
    return { name: "IPAWZ", email: texto };
}

async function chamarBrevo(caminho, opcoes = {}) {
    const resposta = await fetch(BREVO_API_URL + caminho, {
        ...opcoes,
        headers: { "api-key": BREVO_API_KEY, accept: "application/json", "content-type": "application/json", ...(opcoes.headers || {}) },
        signal: AbortSignal.timeout(15000)
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
        const erro = new Error(`Brevo respondeu ${resposta.status}: ${corpo.message || corpo.code || "erro desconhecido"}`);
        erro.status = resposta.status;
        throw erro;
    }
    return corpo;
}

function modeloCodigo(nome, codigo, minutos) {
    return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#FDFBD4;padding:32px">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e2b8">
        <div style="background:#7A2E1C;color:#fff;padding:18px 24px;font-size:22px;font-weight:bold">IPAWZ 🐾</div>
        <div style="padding:24px;color:#333;line-height:1.6">
          <p>Olá${nome ? ", " + nome : ""}!</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta. Use o código abaixo:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#1C5F9D;text-align:center;margin:24px 0">${codigo}</p>
          <p>O código vale por <strong>${minutos} minutos</strong>. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
        </div>
      </div>
    </div>`;
}

async function enviarCodigoSenha({ para, nome, codigo, minutos }) {
    if (!configurado) {
        console.warn(`\n[E-mail] E-mail não configurado no .env. Código de redefinição para ${para}: ${codigo}\n`);
        return { simulado: true };
    }
    const assunto = `IPAWZ - seu código para redefinir a senha: ${codigo}`;
    const texto = `Seu código para redefinir a senha do IPAWZ é ${codigo}. Ele vale por ${minutos} minutos.`;
    const html = modeloCodigo(nome, codigo, minutos);

    if (usaBrevo) {
        // https://developers.brevo.com/reference/sendtransacemail
        await chamarBrevo("/smtp/email", {
            method: "POST",
            body: JSON.stringify({
                sender: remetente(),
                to: [{ email: para, ...(nome ? { name: nome } : {}) }],
                subject: assunto,
                textContent: texto,
                htmlContent: html
            })
        });
        return { simulado: false };
    }

    await transporte.sendMail({ from: EMAIL_REMETENTE || SMTP_USER, to: para, subject: assunto, text: texto, html });
    return { simulado: false };
}

// Usado pelo "npm run verificar"
async function testarConexao() {
    if (!configurado) return { ok: false, mensagem: "não configurado (o código vai aparecer no terminal)" };
    if (usaBrevo) {
        try {
            const conta = await chamarBrevo("/account");
            return { ok: true, mensagem: `API do Brevo ok (conta ${conta.email || "conectada"})` };
        } catch (erro) {
            // Chave "Restrita" sem acesso aos dados da conta: a chave existe e é válida.
            // O que importa para o IPAWZ é a permissão de enviar e-mails transacionais.
            if (erro.status === 403) {
                return {
                    ok: true,
                    mensagem: "chave do Brevo válida (restrita, sem acesso aos dados da conta). " +
                        "Confira se ela tem permissão de envio de e-mails transacionais e teste em \"Esqueci minha senha\""
                };
            }
            return { ok: false, mensagem: "API do Brevo recusou: " + erro.message };
        }
    }
    try {
        await transporte.verify();
        return { ok: true, mensagem: `SMTP ok (${SMTP_HOST})` };
    } catch (erro) {
        return { ok: false, mensagem: "SMTP recusou a conexão: " + erro.message };
    }
}

module.exports = { enviarCodigoSenha, testarConexao, emailConfigurado: configurado };
