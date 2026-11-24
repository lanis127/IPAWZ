/* Cria dados de exemplo para apresentar o projeto:
   7 instituições (fictícias), 9 pets e 3 vagas.
   Rode com:  npm run exemplo
   Pode rodar de novo: o que já existe é pulado (útil para quem
   rodou a versão antiga, que criava só 1 instituição).
   Login de qualquer instituição de exemplo: <e-mail abaixo> / ipawz123
   Cada instituição de exemplo ganha uma chave Pix ALEATÓRIA FICTÍCIA: o QR Code
   aparece, mas o app do banco vai dizer que a chave não existe. Para testar um
   Pix de verdade, entre como a instituição e troque pela sua chave em "Chave Pix". */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const { supabase, BUCKET_IMAGENS } = require("./config/supabase");

const PASTA_IMG = path.join(__dirname, "..", "..", "frontend", "assets", "img");
const SENHA = "ipawz123";

// Nomes, CNPJs e e-mails são fictícios (só para testes)
const INSTITUICOES = [
    { email: "ong@ipawz.com", nome: "Projeto Patas Unidas", razao: "Associação Patas Unidas", cnpj: "11222333000181",
      tipo: "ONG", cidade: "Barueri", bairro: "Centro", imagem: "Animais-metrica.png",
      descricao: "Resgata, cuida e encaminha para adoção cães e gatos abandonados na região de Barueri." },
    { email: "larfeliz@ipawz.com", nome: "Abrigo Lar Feliz", razao: "Abrigo Lar Feliz Proteção Animal", cnpj: "90000001000129",
      tipo: "Abrigo", cidade: "Osasco", bairro: "Vila Yara", imagem: "adote-pet-azul.png",
      descricao: "Abrigo que acolhe cerca de 80 animais e promove feiras de adoção todo mês." },
    { email: "focinho@ipawz.com", nome: "Instituto Focinho Amigo", razao: "Instituto Focinho Amigo", cnpj: "90000002000173",
      tipo: "Instituto", cidade: "São Paulo", bairro: "Pinheiros", imagem: "cao-azul.png",
      descricao: "Oferece castração e atendimento veterinário a preço social para animais de famílias de baixa renda." },
    { email: "quatropatas@ipawz.com", nome: "ONG Quatro Patas do Bem", razao: "Quatro Patas do Bem", cnpj: "90000003000118",
      tipo: "ONG", cidade: "Carapicuíba", bairro: "Centro", imagem: "adote-card.png",
      descricao: "Grupo de voluntários que resgata animais em situação de rua e busca lares temporários." },
    { email: "miauau@ipawz.com", nome: "Associação Miau & Au", razao: "Associação Miau e Au", cnpj: "90000004000162",
      tipo: "Associação", cidade: "Cotia", bairro: "Granja Viana", imagem: "doe-card.png",
      descricao: "Arrecada ração, remédios e cobertores para protetores independentes da região." },
    { email: "refugio@ipawz.com", nome: "Refúgio dos Bichos", razao: "Fundação Refúgio dos Bichos", cnpj: "90000005000107",
      tipo: "Fundação", cidade: "Santana de Parnaíba", bairro: "Fazendinha", imagem: "voluntario-card.png",
      descricao: "Santuário para animais idosos ou com deficiência que dificilmente seriam adotados." },
    { email: "adoteumamigo@ipawz.com", nome: "Projeto Adote um Amigo", razao: "Projeto Adote um Amigo", cnpj: "90000006000151",
      tipo: "ONG", cidade: "Jandira", bairro: "Centro", imagem: "caridade.png",
      descricao: "Conecta famílias a cães e gatos resgatados, com acompanhamento depois da adoção." }
];

async function enviarFoto(arquivo, pasta) {
    const caminho = `${pasta}/${arquivo}`;
    const tipo = arquivo.endsWith(".png") ? "image/png" : "image/jpeg";
    const { error } = await supabase.storage.from(BUCKET_IMAGENS)
        .upload(caminho, fs.readFileSync(path.join(PASTA_IMG, arquivo)), { contentType: tipo, upsert: true });
    if (error) throw error;
    return supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}

// Cria a conta + o perfil da instituição (já validada). Devolve o id, ou null se já existia.
async function criarInstituicao(ong) {
    const { data: existe } = await supabase.from("perfis").select("id, pix_chave").eq("email", ong.email).maybeSingle();
    if (existe) {
        // quem rodou antes da versão com Pix: só acrescenta a chave de teste
        if (!existe.pix_chave) {
            await supabase.from("perfis").update({ pix_tipo_chave: "aleatoria", pix_chave: crypto.randomUUID() }).eq("id", existe.id);
            console.log("já existe (chave Pix de teste adicionada):", ong.nome);
        } else {
            console.log("já existe:", ong.nome);
        }
        return null;
    }
    const { data: criado, error } = await supabase.auth.admin.createUser({ email: ong.email, password: SENHA, email_confirm: true });
    if (error) throw error;
    const id = criado.user.id;

    const { error: erroPerfil } = await supabase.from("perfis").insert({
        id, tipo: "pj", email: ong.email, nome: ong.nome, razao_social: ong.razao, cnpj: ong.cnpj,
        telefone: "(11) 4000-0000", tipo_instituicao: ong.tipo, descricao: ong.descricao,
        rua: "Rua Exemplo", numero: "100", bairro: ong.bairro, cidade: ong.cidade, estado: "SP", cep: "06401136",
        foto_url: await enviarFoto(ong.imagem, `exemplo/${id}`),
        // instituições de exemplo já aparecem como validadas (sem documentos reais)
        representante_nome: "Representante Exemplo", representante_cpf: "52998224725",
        status_validacao: "aprovado", validacao_enviada_em: new Date().toISOString(),
        pix_tipo_chave: "aleatoria", pix_chave: crypto.randomUUID()   // fictícia
    });
    if (erroPerfil) {
        await supabase.auth.admin.deleteUser(id);
        throw erroPerfil;
    }
    console.log("instituição:", ong.nome);
    return id;
}

(async () => {
    const ids = [];
    for (const ong of INSTITUICOES) ids.push(await criarInstituicao(ong));

    // Pets e vagas só são criados junto com a primeira instituição (Projeto Patas Unidas)
    const id = ids[0];
    if (!id) {
        console.log(`\nPronto! Entre com qualquer e-mail de exemplo e a senha ${SENHA}.`);
        process.exit(0);
        return;
    }

    const pets = [
        ["Duke", "cachorro", "macho", "6 anos", "adulto", "grande", "brincalhao", "duke.jpg"],
        ["Zoe", "cachorro", "femea", "2 anos", "jovem", "medio", "sociavel", "zoe.jpg"],
        ["Nala", "gato", "femea", "3 meses", "filhote", "pequeno", "calmo", "nala.jpg"],
        ["Salém", "gato", "macho", "5 anos", "adulto", "medio", "independente", "salem.jpg"],
        ["Nazinha", "gato", "femea", "7 anos", "idoso", "medio", "calmo", "nazinha.jpg"],
        ["Pipoca", "cachorro", "femea", "4 anos", "adulto", "pequeno", "sociavel", "pipoca.jpg"],
        ["Loro", "passaro", "macho", "2 anos", "jovem", "pequeno", "sociavel", "loro.jpg"],
        ["Marley", "cachorro", "macho", "4 meses", "filhote", "medio", "brincalhao", "marley.jpg"],
        ["Mia", "gato", "femea", "3 anos", "adulto", "medio", "independente", "nala2.jpg"]
    ];
    for (const [nome, especie, sexo, idade, faixa_etaria, porte, temperamento, foto] of pets) {
        const { error: e } = await supabase.from("pets").insert({
            dono_id: id, nome, especie, sexo, idade, faixa_etaria, porte, temperamento,
            vacinado: true, castrado: true, sociavel_pets: true, sociavel_pessoas: true,
            descricao: `${nome} é muito carinhoso(a) e está pronto(a) para encontrar uma família.`,
            cidade: "Barueri", uf: "SP", foto_url: await enviarFoto(foto, `exemplo/${id}`)
        });
        if (e) throw e;
        console.log("pet:", nome);
    }

    const imagemVaga = await enviarFoto("vaga-voluntariado.jpg", `exemplo/${id}`);
    const vagas = [
        ["Passeio com pets", "Osasco - SP", "2027-04-17"],
        ["Cuidados com os animais (alimentação, higiene e bem-estar)", "Barueri - SP", "2027-05-02"],
        ["Serviços administrativos", "Cotia - SP", "2027-03-05"]
    ];
    for (const [tipo_servico, local, data] of vagas) {
        const { error: e } = await supabase.from("vagas").insert({
            instituicao_id: id, tipo_servico, local, data, imagem_url: imagemVaga,
            descricao: "Estamos em busca de pessoas que gostem de animais e queiram contribuir com o bem-estar dos animais acolhidos.\nNão é necessário ter experiência anterior."
        });
        if (e) throw e;
    }

    console.log(`\nPronto! Entre com ong@ipawz.com (ou outro e-mail de exemplo) e a senha ${SENHA}.`);
    process.exit(0);
})().catch((erro) => {
    console.error("Erro ao criar dados de exemplo:", erro.message || erro);
    process.exit(1);
});
