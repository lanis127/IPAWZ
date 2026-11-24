/* Recebe arquivos enviados por formulário (multipart/form-data).
   - upload / salvarImagem: fotos públicas (pets, perfis, vagas) -> bucket "imagens"
   - uploadDocumentos / salvarDocumento: documentos de validação -> bucket PRIVADO "documentos" */
const multer = require("multer");
const crypto = require("crypto");
const { supabase, BUCKET_IMAGENS, BUCKET_DOCUMENTOS } = require("../config/supabase");
const { ErroHttp } = require("../utils/erros");

const IMAGENS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENTOS = [...IMAGENS, "application/pdf"];

function criarUpload(tiposAceitos, tamanhoMaximoMb, mensagem) {
    return multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: tamanhoMaximoMb * 1024 * 1024, files: 6 },
        fileFilter: (req, arquivo, cb) => {
            if (tiposAceitos.includes(arquivo.mimetype)) return cb(null, true);
            cb(new ErroHttp(400, mensagem));
        }
    });
}

const upload = criarUpload(IMAGENS, 5, "Envie uma imagem JPG, PNG, WEBP ou GIF.");
const uploadDocumentos = criarUpload(DOCUMENTOS, 8, "Envie os documentos em PDF ou imagem (JPG, PNG ou WEBP).");

const extensao = (arquivo) => (arquivo.mimetype === "application/pdf" ? "pdf" : arquivo.mimetype.split("/")[1].replace("jpeg", "jpg"));

async function enviar(bucket, arquivo, pasta) {
    const caminho = `${pasta}/${crypto.randomUUID()}.${extensao(arquivo)}`;
    const { error } = await supabase.storage
        .from(bucket)
        .upload(caminho, arquivo.buffer, { contentType: arquivo.mimetype, upsert: false });
    if (error) {
        console.error("[Storage]", error);
        throw new ErroHttp(500, `Não foi possível salvar o arquivo. Confira se o bucket "${bucket}" existe.`);
    }
    return caminho;
}

// Foto pública: devolve a URL
async function salvarImagem(arquivo, pasta) {
    if (!arquivo) return null;
    const caminho = await enviar(BUCKET_IMAGENS, arquivo, pasta);
    return supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}

// Documento privado: devolve só o caminho (não existe link público)
async function salvarDocumento(arquivo, pasta) {
    if (!arquivo) return null;
    return enviar(BUCKET_DOCUMENTOS, arquivo, pasta);
}

const ehImagem = (arquivo) => Boolean(arquivo) && IMAGENS.includes(arquivo.mimetype);

module.exports = { upload, uploadDocumentos, salvarImagem, salvarDocumento, ehImagem };
