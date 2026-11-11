# IPAWZ — Backend de inativação de pets

Pacote de referência com Node.js, Express, MySQL e JWT.

## Estrutura esperada do banco
O código considera:
- `usuario(id_usuario, nome, email, senha_hash)`;
- `pet(id_pet, id_usuario, nome, especie, raca, idade, sexo, porte, descricao, foto_url, status, data_cadastro)`;
- status `Disponível` e `Inativo`.

**Atenção:** no esquema anteriormente analisado do IPAWZ, a tabela `pet` possuía `id_instituicao NOT NULL` e não possuía `id_usuario`. Se isso ainda for verdade, NÃO execute a migração nem use a verificação por `id_usuario` sem adaptar a regra. Nesse cenário, a titularidade pode precisar ser validada pela instituição (`id_instituicao`) e pelo usuário responsável por ela. Confira o banco real antes de integrar.

## Instalação
1. Faça backup do banco.
2. Instale Node.js.
3. Execute `npm install` nesta pasta.
4. Copie `.env.example` para `.env` e informe os dados do MySQL.
5. Use um `JWT_SECRET` forte e igual ao utilizado pelo backend que gera os tokens.
6. Confira o esquema e só então execute `sql/migracao_inativacao_pet.sql`.
7. Inicie com `npm run dev` ou `npm start`.

## Endpoints
- `POST /api/auth/login` — login e emissão de JWT.
- `GET /api/pets/disponiveis` — listagem pública somente de pets disponíveis.
- `GET /api/pets/meus` — listagem autenticada dos pets do usuário, incluindo inativos.
- `PATCH /api/pets/:id/inativar` — inativação lógica.
- `DELETE /api/pets/:id` — alias que também inativa, sem apagar o registro.

Para as rotas privadas, envie `Authorization: Bearer SEU_TOKEN_JWT`.

Exemplo de body da inativação:
```json
{ "motivo": "Pet adotado" }
```

## Integração com o frontend
Recomendação: criar uma área **Meus pets** no painel/perfil do usuário ou instituição. Em cada cartão, mostrar ações como Editar e Inativar. Ao clicar em Inativar, exibir uma confirmação e então chamar `PATCH /api/pets/:id/inativar`. Depois, atualizar a listagem. Não é necessária uma página exclusiva.

## Observações
Este pacote inclui login de referência e rotas de inativação/listagem; não substitui automaticamente os arquivos de cadastro de pets já existentes no repositório. Integre as novas funções às rotas e controllers atuais, evitando duplicar autenticação e servidor. Não publique `.env` nem execute migrações sem conferir as colunas existentes.
