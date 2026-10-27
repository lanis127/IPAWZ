# IPAWZ — autenticação integrada e cadastro de pets

Este pacote alinha o login ao SQL existente (`usuario.id_usuario`, `usuario.senha_hash`) e adiciona `POST /api/pets`, protegido por JWT e com upload local obrigatório da foto.

## 1. Antes de começar

1. Faça backup do banco `ipawz`.
2. Abra `sql/migracao_pet_usuario.sql` e execute no MySQL **uma única vez**. A migração adiciona os campos usados pelo formulário, torna `id_instituicao` opcional e adiciona `id_usuario` para identificar quem cadastrou o pet.
3. Confira o resultado do `SELECT` no final da migração. Registros antigos que não tenham instituição/responsável podem continuar com `id_usuario` nulo; a API, porém, sempre grava o usuário autenticado.
4. Copie `.env.example` para `.env` e preencha as credenciais reais do seu MySQL. Defina `JWT_SECRET` com uma chave aleatória forte de pelo menos 32 caracteres. Não envie o `.env` ao GitHub.

## 2. Instalar e executar

Dentro desta pasta:

```bash
npm install
npm run dev
```

O servidor inicia na porta `3006` por padrão. O MySQL precisa estar ligado e o banco `ipawz` precisa existir.

## 3. Rotas

- `POST /api/auth/login` — recebe JSON `{ "email": "...", "senha": "..." }` e retorna `token`.
- `POST /api/pets` — requer `Authorization: Bearer SEU_TOKEN` e `multipart/form-data`.

Campos do cadastro:

- Obrigatórios: `nome`, `porte`, `sexo`, `idade`, `especie`, `vacinado`, `castrado`, `doenca`, `foto`.
- `idade` deve ser um inteiro maior que zero.
- `vacinado` e `castrado`: `sim` ou `não` (também aceita `nao`).
- `doenca`: se não houver doença, envie `Nenhuma`.
- O arquivo deve usar o nome de campo `foto`, formato JPG/JPEG/PNG/WEBP e no máximo 5 MB.
- Opcionais: `temperamento`, `sociavel_com_pets`, `sociavel_com_pessoas`, `descricao`, `raca`. Campos opcionais vazios são gravados como `NULL`.

A imagem fica em `uploads/` e é servida pela rota `/uploads/nome-do-arquivo`. Em produção, configure armazenamento persistente e limite de acesso conforme a infraestrutura.

## 4. Atenção à autenticação

O login espera que a senha cadastrada esteja armazenada em `usuario.senha_hash` com bcrypt. O token contém `id_usuario`, compatível com a chave primária do SQL existente. O código de autenticação antigo consultava uma tabela `usuarios` e colunas `id`/`senha`, que não correspondem ao script SQL encontrado.

## 5. Integração com o formulário

Envie os dados com `FormData`, incluindo `foto` como `input type="file"`. Não defina manualmente o cabeçalho `Content-Type` ao usar `fetch` com `FormData`, pois o navegador adiciona o boundary correto. Inclua `Authorization: Bearer ${token}`.

Este pacote foi preparado com base no SQL e nos arquivos do branch `Alanis-Moura`; não foi possível gravá-lo diretamente no GitHub por falta de permissão de escrita da integração. Revise os arquivos e integre-os à pasta do backend do projeto.
