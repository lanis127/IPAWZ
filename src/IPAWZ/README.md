# IPAWZ 🐾

Plataforma de adoção, doação e voluntariado para a causa animal.
Projeto Interdisciplinar, Gestão da Tecnologia da Informação, Fatec Barueri.

- **Frontend:** HTML, CSS e JavaScript puro (`frontend/`)
- **Backend:** Node.js + Express 5 (`backend/`)
- **Banco de dados e login:** Supabase (PostgreSQL + Auth + Storage) (`database/`)

---

## Como rodar (passo a passo)

### 1. Criar o projeto no Supabase
1. Crie uma conta em <https://supabase.com> e clique em **New project**.
2. No menu do projeto, abra **SQL Editor**, cole o arquivo `database/schema.sql` inteiro e clique em **Run**.
   Ele cria as tabelas, as regras de segurança, o bucket público `imagens` (fotos) e o bucket **privado** `documentos` (documentos de validação).
   - **Já tinha criado o banco com uma versão anterior?** Rode, nesta ordem, o que ainda não rodou: `database/migracao-002.sql` e `database/migracao-003-pix.sql`. Elas só acrescentam o que falta, sem apagar nada.
3. Em **Project Settings → API** copie:
   - **Project URL**
   - a chave **anon public**
   - a chave **service_role** (é secreta: nunca coloque no frontend nem no GitHub)

### 2. Configurar o backend
```bash
cd backend
cp .env.example .env      # no Windows: copy .env.example .env
```
Abra o `.env` e cole a URL e as duas chaves.

```bash
npm install
npm run verificar         # confere o .env, as tabelas, os buckets e o e-mail
npm run exemplo           # (opcional) cria 7 instituições, 9 pets e 3 vagas de exemplo
npm run dev               # liga o servidor
```

### 3. Abrir o site
Acesse **<http://localhost:3000>**. O próprio Express entrega o site e a API, então não precisa do Live Server.
(Se preferir o Live Server do VS Code, ele também funciona: o site chama a API em `localhost:3000`.)

Contas de exemplo (depois do `npm run exemplo`), todas com a senha `ipawz123` e já validadas: `ong@ipawz.com` (tem os pets e as vagas), `larfeliz@ipawz.com`, `focinho@ipawz.com`, `quatropatas@ipawz.com`, `miauau@ipawz.com`, `refugio@ipawz.com` e `adoteumamigo@ipawz.com`. Os nomes e CNPJs são fictícios. Já rodou o `npm run exemplo` antes? Pode rodar de novo: ele pula o que já existe e só cria as instituições novas.

### 4. E-mail do código de redefinição de senha
O e-mail de recuperação não chegava porque o servidor de e-mail padrão do Supabase **só entrega para os e-mails da equipe do projeto** (e no máximo 2 por hora).
Agora o próprio backend gera o código de 6 dígitos (válido por 15 minutos, até 5 tentativas) e envia pelo **Gmail do projeto** com o Nodemailer:

1. Entre em `pets.ipawz@gmail.com` e ative a **Verificação em duas etapas** (Conta Google → Segurança).
2. Abra <https://myaccount.google.com/apppasswords>, crie uma senha de app chamada "IPAWZ" e copie as 16 letras.
3. No `backend/.env`, preencha `SMTP_PASS` com essas letras (sem espaços). Os outros campos `SMTP_*` já vêm prontos no `.env.example`.
4. Rode `npm run verificar`: a linha do e-mail deve mostrar "SMTP ok".

Sem o `SMTP_PASS`, o site continua funcionando para testes: o código aparece no terminal onde o `npm run dev` está rodando.

**Na hospedagem, use o Brevo em vez do Gmail.** As hospedagens gratuitas (Render, Railway) bloqueiam o SMTP, então o Gmail não consegue enviar de lá. O Brevo envia pela internet comum (HTTPS) e é grátis até 300 e-mails por dia:

1. Crie uma conta grátis em <https://www.brevo.com>.
2. Em **Senders, Domains & Dedicated IPs → Senders**, cadastre `pets.ipawz@gmail.com` e confirme pelo e-mail que o Brevo manda.
3. Em **SMTP & API → API Keys**, gere uma chave e copie.
4. Coloque a chave em `BREVO_API_KEY` (no `.env` ou nas variáveis da hospedagem). Com ela preenchida, o backend usa o Brevo no lugar do Gmail; o `npm run verificar` mostra "API do Brevo ok".

Atenção: o Brevo não consegue "autenticar" endereços @gmail.com. Ele troca o remetente por um endereço próprio dele (o nome "IPAWZ" continua aparecendo) e o e-mail pode cair no **spam**. Para um projeto acadêmico isso basta (avise para olhar o spam). Para evitar, seria preciso um domínio próprio (ex.: `ipawz.com.br`) autenticado no Brevo.

### 5. Aprovar (ou recusar) a validação de uma conta
Não existe painel de administração. A equipe confere os documentos em **Storage → documentos** no Supabase e muda o status no **SQL Editor**:

```sql
update perfis set status_validacao = 'aprovado' where email = 'ong@exemplo.com';

-- ou, se algo estiver errado (o motivo aparece para a instituição/pessoa no site):
update perfis set status_validacao = 'rejeitado',
       validacao_observacao = 'O comprovante de endereço está ilegível.'
 where email = 'ong@exemplo.com';
```

### 6. Doação financeira por Pix
A doação financeira funciona **só por Pix**, e o dinheiro cai **direto na conta da instituição**. Não precisa de conta em banco, API nem credencial: o próprio backend monta o código Pix.

1. A instituição entra em **menu ☰ → Chave Pix para doações** (`chave-pix.html`) e cadastra a chave (CNPJ, e-mail, celular, chave aleatória ou CPF).
2. Instituições **aprovadas** e com chave aparecem para doação financeira. As outras ficam desativadas na lista, com o aviso "ainda não recebe Pix" (doações de itens continuam normais).
3. O doador escolhe o valor (R$ 1,00 a R$ 10.000,00) e clica em **Gerar QR Code Pix**. O site mostra o QR Code, o "Pix copia e cola", o nome da instituição e um identificador (`IPAWZD<número da doação>`).
4. O doador paga no app do banco. Quem estava logado pode abrir o QR Code de novo em **Histórico de doações → Ver QR Code Pix**.
5. Quando o dinheiro cair, a instituição clica em **Confirmar Pix recebido** em **Doações recebidas**. O identificador ajuda a achar o Pix no extrato (muitos bancos mostram esse código no comprovante).

**Como funciona por dentro:** o QR Code do Pix é só um texto no padrão BR Code do Banco Central. `backend/src/utils/pix.js` monta esse texto (chave, valor, nome, cidade, identificador e o CRC16 de conferência) e o site desenha o QR Code com `frontend/js/vendor/qrcode.js`, sem biblioteca externa.

**Limite desse modelo (Pix estático):** a IPAWZ não fica sabendo sozinha que o Pix foi pago, por isso a confirmação é da instituição. Confirmação automática exigiria a API Pix de um banco ou de um intermediador.

**Para testar:** as instituições do `npm run exemplo` ganham uma chave aleatória **fictícia**. O QR Code aparece, mas o app do banco vai dizer que a chave não existe. Para testar um pagamento de verdade, entre como a instituição e cadastre a sua própria chave (pague R$ 1,00 de outra conta).

### 7. Entrar com Google (opcional)
1. No **Google Cloud Console** (<https://console.cloud.google.com>), crie um projeto. Depois abra **APIs e serviços → Tela de consentimento OAuth**, escolha "Externo" e preencha o nome do app (IPAWZ) e o e-mail. Em **Usuários de teste**, adicione os e-mails do grupo: enquanto o app estiver "em teste", só eles conseguem entrar.
2. Em **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**, escolha **Aplicativo da Web**.
   - Em **Origens JavaScript autorizadas**, coloque `http://localhost:3000`.
   - Em **URIs de redirecionamento autorizados**, cole a "Callback URL" que aparece no Supabase em **Authentication → Providers → Google**. Ela tem o formato `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
3. Copie o **Client ID** e o **Client Secret**, cole no Supabase (**Authentication → Providers → Google**), ative e salve. O Client Secret fica só no Supabase.
4. No Supabase, em **Authentication → URL Configuration**, coloque `http://localhost:3000` em **Site URL** e adicione em **Redirect URLs**: `http://localhost:3000/**` (e `http://127.0.0.1:5500/**`, se usar o Live Server).
5. No `backend/.env`, confira `SITE_URL=http://localhost:3000`, mude para `GOOGLE_LOGIN_ATIVO=true` e reinicie o servidor. O `npm run verificar` mostra se o Google está ligado.

No primeiro acesso pelo Google, a tela `login-google.html` pede para completar o cadastro (pessoa física ou instituição), com nome e e-mail do Google já preenchidos, e a pessoa segue o mesmo caminho do cadastro normal. Quem já tem conta com o mesmo e-mail entra na mesma conta. O botão aparece no login e nos dois cadastros.

**Usando outra porta?** Troque a porta também no `SITE_URL`, nas origens do Google Cloud e nas Redirect URLs do Supabase.

### 8. Publicar na internet (grátis: Render + Supabase + Brevo)
1. **GitHub:** suba a pasta `ipawz` para um repositório (pode ser privado). O `.gitignore` já deixa de fora o `.env` e o `node_modules`: confira no GitHub que o `.env` **não** apareceu.
2. **Render** (<https://render.com>, entre com a conta do GitHub) → **New → Web Service** → escolha o repositório e preencha:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Em **Environment Variables**, cadastre as mesmas variáveis do seu `.env` (Supabase, `BREVO_API_KEY`, `EMAIL_REMETENTE`, `GOOGLE_LOGIN_ATIVO`...). **Não** cadastre `PORT`: o Render escolhe a porta sozinho. Não precisa das variáveis `SMTP_*`.
4. Clique em **Deploy**. No fim aparece o endereço (ex.: `https://ipawz.onrender.com`). Volte em Environment Variables e cadastre:
   - `SITE_URL=https://ipawz.onrender.com`
   - `CORS_ORIGENS=https://ipawz.onrender.com`
5. **Supabase** → Authentication → URL Configuration: coloque o endereço novo em **Site URL** e acrescente `https://ipawz.onrender.com/**` em **Redirect URLs**.
6. **Google Cloud** (se usar o login com Google): acrescente o endereço novo em **Origens JavaScript autorizadas**.

Limites do plano grátis:
- O Render "adormece" o site depois de 15 minutos sem acesso; o primeiro acesso depois disso demora até 1 minuto. Antes de uma apresentação, abra o site alguns minutos antes.
- O Supabase pausa o projeto depois de cerca de 1 semana sem uso (manda e-mail antes). Para voltar: painel do Supabase → **Resume project**. Os dados não se perdem.
- O Brevo envia até 300 e-mails por dia.

---

## Regras de acesso e fluxos de cadastro

### Pessoa física: cadastro em etapas
1. **Cadastro** (`cadastro-pf.html`): dados básicos.
2. **Seleção de perfil** (`selecao-tipo-usuario.html`, igual ao Figma). Dá para trocar depois pelo menu ou pelo Perfil.

   | Perfil | Doar | Solicitar e acompanhar adoção | Candidatar-se e acompanhar candidaturas |
   |---|:-:|:-:|:-:|
   | Usuário Simples | ✓ | ✗ | ✗ |
   | Usuário Adotante | ✓ | ✓ | ✗ |
   | Usuário Voluntário | ✓ | ✗ | ✓ |
   | Usuário Multifuncional | ✓ | ✓ | ✓ |

3. **Usuário Simples** termina aqui. Os outros vão para a **Validação de pessoa física** (`validacao-pf.html`): CPF, endereço, experiência com animais e selfie com documento.
   Isso é feito **uma vez só**: os dados ficam no perfil e vão junto em cada pedido de adoção ou candidatura, sem precisar preencher de novo.

Se a pessoa tentar adotar ou se candidatar sem o perfil certo ou sem validação, o site leva para a etapa que falta e depois volta para onde ela estava.

### Instituição / ONG: validação obrigatória
1. **Cadastro** (`cadastro-pj.html`) → 2. **Validação da instituição** (`validacao-instituicao.html`): nome e CPF do representante legal, Cartão CNPJ, RG/CNH do representante, selfie do representante com o documento e comprovante de endereço (PDF ou imagem, até 8 MB cada).

Enquanto os documentos não forem enviados, qualquer página leva de volta para a validação, e a API recusa anunciar pets e vagas. Depois do envio, `status_validacao` fica `pendente` até a equipe aprovar (veja o item 5 acima). A instituição usa a plataforma normalmente nesse período, com um aviso de "em análise".

### Quem vê o quê
| Página | Pessoa física | Instituição |
|---|:-:|:-:|
| Minhas solicitações de adoção | ✓ (Adotante/Multifuncional) | ✗ |
| Acompanhar candidaturas | ✓ (Voluntário/Multifuncional) | ✗ |
| Histórico de doações | ✓ | ✗ |
| Solicitações recebidas | ✓ (só dos pets que ela mesma cadastrou; no menu: "Solicitações dos meus pets") | ✓ (dos pets da instituição) |
| Administrar vagas | ✗ | ✓ |
| Doações recebidas (sem botão "Fazer uma doação") | ✗ | ✓ |
| Chave Pix para doações | ✗ | ✓ |

Quem cadastrou o pet é quem responde às solicitações de adoção dele: a instituição, ou a pessoa física que anunciou o próprio pet. Ninguém vê nem responde às solicitações de pets de outras pessoas.

O menu lateral só mostra o que a conta pode usar. Se alguém digitar o endereço de uma página proibida, volta para a home. O backend confere as mesmas regras em todas as rotas, então mesmo chamando a API direto não dá para burlar.

---

## Estrutura

```
ipawz/
├── database/
│   ├── schema.sql               banco completo (instalação nova)
│   ├── migracao-002.sql         mudanças da v2, para quem já tinha o banco
│   └── migracao-003-pix.sql     colunas da chave Pix
├── backend/
│   ├── .env.example             modelo das variáveis (copie para .env)
│   └── src/
│       ├── server.js            liga o Express, as rotas e serve o site
│       ├── config/supabase.js   conexão com o Supabase
│       ├── middlewares/         login (token), regras de acesso, upload e erros
│       ├── routes/              auth, perfil, validacao, pets, adocoes, voluntariado, doacoes
│       ├── services/email.js    envio do código de senha (API do Brevo ou Gmail/Nodemailer)
│       ├── utils/               validações (CPF, CNPJ...), regras de perfil, erros e pix.js (código Pix)
│       ├── verificar-conexao.js npm run verificar
│       └── dados-exemplo.js     npm run exemplo
└── frontend/
    ├── html/                    as telas
    ├── css/layout.css           header, menu lateral, footer e cores (todas as telas)
    ├── css/<tela>.css           estilo de cada tela
    ├── js/api.js                fala com o backend (token, erros, avisos)
    ├── js/layout.js             monta header, menu lateral e footer
    ├── js/auth.js               login, cadastro e recuperação de senha
    ├── js/campo-arquivo.js      envio de arquivo com prévia (telas de validação)
    ├── js/pix.js                painel do QR Code Pix (doação e histórico)
    ├── js/vendor/qrcode.js      gerador de QR Code (MIT, Kazuhiko Arase)
    └── js/<tela>.js             lógica de cada tela
```

### Como uma tela usa o layout compartilhado
```html
<body data-pagina="adocao" data-protegida="true">
    <div id="ipz-header"></div>
    <main>...conteúdo da tela...</main>
    <div id="ipz-footer"></div>

    <script src="../js/api.js"></script>
    <script src="../js/layout.js"></script>
    <script src="../js/minha-tela.js"></script>
</body>
```
- `data-pagina`: qual link do topo fica destacado (`home`, `adocao`, `doacao`, `voluntarios`, `perfil`)
- `data-protegida`: `true` exige login; `pf` ou `pj` exige aquele tipo de conta

Para mudar o header ou o footer, altere **só** `js/layout.js` e `css/layout.css`. Vale para o site inteiro.

---

## API

Rotas marcadas com 🔒 precisam do cabeçalho `Authorization: Bearer <token>` (o `api.js` envia sozinho).

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/cadastro` | cria conta PF ou PJ e já devolve logado |
| POST | `/api/auth/login` | login (devolve token e perfil) |
| GET 🔒 | `/api/auth/eu` | quem está logado |
| POST | `/api/auth/recuperar-senha` | gera o código e envia por e-mail (Nodemailer) |
| POST | `/api/auth/redefinir-senha` | código + nova senha |
| GET | `/api/auth/google` | leva para o login do Google (via Supabase) |
| POST | `/api/auth/google/sessao` | confere o token do Google; entra ou pede para completar o cadastro |
| POST | `/api/auth/google/completar` | primeiro acesso pelo Google: cria o perfil PF ou PJ |
| GET | `/api/config` | o que está ligado no servidor (login com Google) |
| GET/PUT 🔒 | `/api/perfil` | ver / editar o próprio perfil |
| PUT 🔒 PF | `/api/perfil/tipo-usuario` | `simples`, `adotante`, `voluntario` ou `multifuncional` |
| GET 🔒 | `/api/validacao` | situação da validação da conta |
| POST 🔒 PF | `/api/validacao/pf` | CPF, endereço, experiência + arquivo `selfieDocumento` |
| POST 🔒 PJ | `/api/validacao/instituicao` | upload múltiplo: `cartaoCnpj`, `documentoRepresentante`, `selfieRepresentante`, `comprovanteEndereco` + `representanteNome`, `representanteCpf` |
| POST 🔒 | `/api/perfil/foto` | foto do perfil (campo `foto`) |
| GET | `/api/instituicoes` | instituições que já enviaram documentos (carrossel e formulário de doação); `aceita_pix` diz se recebem Pix |
| PUT 🔒 PJ | `/api/perfil/pix` | cadastrar ou trocar a chave Pix `{ tipoChave, chave }` |
| DELETE 🔒 PJ | `/api/perfil/pix` | remover a chave Pix |
| GET | `/api/pets?especie=&sexo=&faixaEtaria=&porte=&temperamento=&pagina=` | pets disponíveis, com filtros e paginação |
| GET | `/api/pets/:id` | detalhes do pet e do responsável |
| GET 🔒 | `/api/pets/meus` | pets que eu cadastrei |
| POST/PUT 🔒 | `/api/pets`, `/api/pets/:id` | cadastrar / editar (multipart, campo `foto`) |
| PATCH 🔒 | `/api/pets/:id/status` | `disponivel`, `inativo` ou `adotado` |
| DELETE 🔒 | `/api/pets/:id` | excluir |
| POST 🔒 PF | `/api/adocoes` | enviar formulário de adoção (perfil Adotante/Multifuncional + validação) |
| GET 🔒 PF | `/api/adocoes/minhas` | solicitações que eu enviei |
| GET 🔒 | `/api/adocoes/recebidas` | solicitações para os pets que EU cadastrei, PF ou PJ (com CPF, endereço e experiência do adotante) |
| PATCH 🔒 | `/api/adocoes/:id/status` | só quem cadastrou o pet: `recebida`, `analise`, `aprovada` (o pet vira "adotado"), `recusada` |
| GET | `/api/vagas`, `/api/vagas/:id` | vagas ativas / detalhes |
| GET 🔒 PJ | `/api/vagas/minhas` | vagas da instituição com candidatos |
| POST/PUT 🔒 PJ | `/api/vagas`, `/api/vagas/:id` | criar / editar vaga |
| PATCH 🔒 PJ | `/api/vagas/:id/ativa` | ativar / inativar |
| POST 🔒 PF | `/api/vagas/:id/candidaturas` | candidatar-se (perfil Voluntário/Multifuncional + validação) |
| GET 🔒 PF | `/api/candidaturas/minhas` | minhas candidaturas |
| PATCH 🔒 PJ | `/api/candidaturas/:id/status` | `analise`, `aceita`, `negada` |
| POST | `/api/doacoes` | registrar doação (com ou sem login; instituição não doa). Financeira devolve `pix` com o copia e cola |
| GET 🔒 PF | `/api/doacoes/:id/pix` | mostrar de novo o Pix de uma doação ainda não confirmada |
| GET 🔒 PF | `/api/doacoes/minhas` | histórico de doações feitas |
| GET 🔒 PJ | `/api/doacoes/recebidas` | doações recebidas pela instituição |
| PATCH 🔒 PJ | `/api/doacoes/:id/status` | `confirmada` ou `entregue` (Pix só `confirmada`) |

Os erros sempre voltam como `{ "erro": "mensagem em português" }`, e o `api.js` mostra essa mensagem na tela.
Quando falta uma etapa, o erro vem com `codigo`: `VALIDACAO_NECESSARIA`, `PERFIL_SEM_PERMISSAO` ou `TIPO_DE_CONTA`. O site usa esse código para levar a pessoa à tela certa.

---

## O que foi corrigido / padronizado

**Inconsistências entre as telas**
- O header, o menu lateral e o footer eram copiados em cada HTML, cada um de um jeito (5 versões de footer, e-mail diferente em uma, tela sem footer). Agora existe uma versão só, igual ao Figma, gerada por `layout.js`.
- As cores e a fonte agora são as do guia do Figma (`#FDFBD4`, `#7A2E1C`, `#7FC9B8`, `#1C5F9D`, Poppins) em todas as telas. Antes havia `#ECE8C8`, `#FFFFCF`, Arial...
- O `<style>` e o `<script>` que estavam dentro do HTML foram para `css/` e `js/`, como nas outras telas.
- Arquivos com espaço no nome foram renomeados (veja a tabela abaixo) e todos os links foram corrigidos.
- Foram removidos os arquivos duplicados: `style.css` (2 cópias), `style1.css`, `stylelistagem.css`, `listagem-pets1.css`, `script1.js`, `script2.js` e o `index.html` de rascunho.
- O cadastro de pet PF e PJ eram duas páginas quase idênticas. Agora é uma só (`cadastro-pet.html`), refeita no tamanho do Figma.
- Os tipos de instituição eram diferentes no cadastro e no perfil, e os temperamentos do cadastro de pet não batiam com o filtro da listagem. Agora as opções são as mesmas.
- O cadastro de pessoa física pede o **Estado (UF)** (o Figma ainda mostra "Tipo de interesse"; falta atualizar lá). O tipo de interesse fica na tela de perfil.
- Foi criada a tela `solicitacoes-adocao.html` (do Figma), para a instituição responder às adoções. O menu apontava para um arquivo que não existia.

**Erros de código**
- Na listagem, o botão "Remover filtros" só funcionava depois de filtrar uma vez (estava dentro do `submit`), e o filtro vinha com opções pré-marcadas que escondiam pets.
- O link "Conheça mais" ia para `tela1 detalhes do pet` sem `.html`.
- `vagas-voluntariado.js`, `acompanhar-adocao.js` e `tipos-doacao.js` quebravam (procuravam elementos que não existiam na página).
- `tipoDoacao.html` e `detalhes-vaga` carregavam CSS/JS com caminho errado (`css/` em vez de `../css/`).
- A imagem do login não carregava (nome do arquivo com "ã" corrompido).
- Vários links apontavam para arquivos que não existiam (`CRIAR TELA FRONT-END ....html`, `indexListagem.html`).

**Integração**
- Todos os dados de exemplo fixos no JavaScript e no `localStorage` foram trocados por chamadas à API.
- Os formulários (login, cadastros, pet, adoção, doação, vaga, candidatura, perfil e senha) agora salvam no banco.

### Arquivos renomeados
| Antes | Agora |
|---|---|
| `tela pessoa fisica.html` | `perfil-pf.html` |
| `tela perfil pessoa juridica.html` | `perfil-pj.html` |
| `tela1 detalhes do pet.html` | `detalhes-pet.html` |
| `cadastro pets pfis.html` / `cadastro pets pj.html` | `cadastro-pet.html` |
| `selecaoPfPj.html` | `selecao-perfil.html` |
| `tipoDoacao.html` | `tipos-doacao.html` |
| `resetsenha.html` / `senha.html` | `recuperar-senha.html` / `redefinir-senha.html` |
| `error404.html` | `erro-404.html` |

---

## Ainda falta (próximos passos)
- **Confirmação automática do Pix:** hoje a instituição confirma à mão. Automatizar exige a API Pix de um banco ou intermediador (Pix dinâmico + webhook).
- **Cartão de crédito/débito:** ficou de fora de propósito; a doação financeira é só por Pix.
- **Painel de aprovação das validações:** por enquanto a aprovação é feita no Supabase (veja "Aprovar a validação de uma conta").
- **Login com Google em produção:** enquanto o app do Google estiver "em teste", só os e-mails cadastrados como testadores entram. Para liberar para todos, é preciso publicar o app no Google Cloud.
- **Termos de uso e privacidade** (`termos.html`): o texto é um modelo. Revise com o orientador.
- As telas de perfil e de detalhes do pet estão menores que no Figma (o CSS original usava fontes pequenas).
- O Figma ainda mostra "Tipo de interesse" no cadastro de pessoa física (o site pede o Estado).
