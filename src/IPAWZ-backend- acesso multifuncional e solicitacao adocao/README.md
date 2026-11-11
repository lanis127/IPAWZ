# Backend IPAWZ — Node.js + Express + MySQL

Este pacote foi preparado para ser colocado em `src/IPAWZ/backend/` no repositório.
A inspeção do repositório mostrou a aplicação frontend em `src/IPAWZ/frontend/` e, no momento da inspeção, não havia `package.json`, servidor Node.js nem script SQL de banco versionado nesse diretório. O README do projeto ainda lista PHP entre as tecnologias, enquanto este backend segue a arquitetura Node.js solicitada.

## O que está implementado

- API REST com Express, Helmet, CORS, limite básico de requisições e tratamento centralizado de erros.
- Pool MySQL com `mysql2/promise`.
- Login com senha armazenada em hash bcrypt e token JWT.
- Middleware de autenticação e autorização por funcionalidade.
- Doação como permissão-base para todos os perfis autenticados.
- Perfis `doador`, `adotante`, `voluntariado` e `multifuncional`.
- Se o usuário marcar todas as opções (adotar + voluntariar; doar é sempre base), o perfil calculado é `multifuncional`.
- Solicitação de adoção autenticada, validada e persistida.
- Exemplo de rota protegida para candidatura a voluntariado.
- Endpoint `/api/auth/me` para o frontend consultar o perfil e as permissões.

## Importante sobre o banco atual

O repositório público contém a pasta de frontend, mas não contém um `schema.sql`/dump SQL que permita confirmar os nomes reais das tabelas e colunas. Portanto, o pacote inclui `database/reference-schema.sql` como **modelo de referência** e os repositories estão escritos para esse modelo:

- `usuarios(id_usuario, nome, email, senha_hash, perfil, ativo)`
- `pets(id_pet, nome, status)`
- `solicitacoes_adocao(id_solicitacao, id_usuario, id_pet, mensagem, status, criado_em)`
- `candidaturas_voluntariado(id_candidatura, id_usuario, mensagem, disponibilidade, status, criado_em)`

**Não execute o SQL de referência cegamente em cima do banco existente.** Compare com seu DER/tabelas atuais e ajuste os nomes nos arquivos `src/repositories/*.js` e, se necessário, o SQL de referência. O pacote não apaga nem altera tabelas existentes automaticamente.

## Instalação

1. Copie a pasta `backend` para `src/IPAWZ/backend/`.
2. Abra o terminal nessa pasta.
3. Execute `npm install`.
4. Copie `.env.example` para `.env` e preencha host, usuário, senha e nome do banco.
5. Defina `JWT_SECRET` com um segredo aleatório forte.
6. Confira e adapte os nomes das tabelas/colunas dos repositories para seu banco real.
7. Garanta que o banco tenha as colunas/tabelas necessárias (use `database/reference-schema.sql` apenas como referência).
8. Inicie com `npm run dev` ou `npm start`.

API padrão: `http://localhost:3000`.

## Rotas

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/health` | Público |
| POST | `/api/auth/cadastro` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |
| POST | `/api/adocoes` | Perfil adotante ou multifuncional |
| GET | `/api/adocoes/minhas` | Perfil adotante ou multifuncional |
| POST | `/api/voluntariado/candidaturas` | Perfil voluntariado ou multifuncional |
| GET | `/api/permissoes` | Autenticado |

A doação é a permissão-base. Este pacote não implementa a operação financeira de doação porque o pedido atual foi implementar adoção e controle de perfis; qualquer endpoint de doação existente deve usar `requirePermission('doar')`.

## Cadastro e cálculo do perfil

`POST /api/auth/cadastro`
```json
{
  "nome": "Pessoa",
  "email": "pessoa@email.com",
  "senha": "senha-segura-123",
  "opcoesPerfil": { "adotar": true, "voluntariar": true }
}
```
O backend calcula `multifuncional` quando as duas opções opcionais estão marcadas. Doar não precisa ser marcado, pois é uma permissão-base para todos os usuários. O frontend nunca define diretamente o nome do perfil.

## Formato de login

`POST /api/auth/login`
```json
{ "email": "pessoa@email.com", "senha": "senha-cadastrada" }
```

Resposta:
```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "JWT...",
  "usuario": {
    "id": 7,
    "nome": "Pessoa",
    "email": "pessoa@email.com",
    "perfil": "multifuncional",
    "permissoes": ["doar", "adotar", "voluntariar"]
  }
}
```

O frontend deve enviar o token nas rotas protegidas:
`Authorization: Bearer SEU_TOKEN`.

## Solicitação de adoção

`POST /api/adocoes`
```json
{
  "idPet": 12,
  "mensagem": "Tenho espaço e disponibilidade para cuidar do animal."
}
```
O identificador do usuário é extraído do JWT, nunca aceito do corpo da requisição. O backend verifica se o pet existe e está disponível antes de gravar a solicitação.

## Perfis e permissões

- `doador`: `doar`
- `adotante`: `doar`, `adotar`
- `voluntariado`: `doar`, `voluntariar`
- `multifuncional`: `doar`, `adotar`, `voluntariar`

A atualização do perfil deve acontecer em uma rota de cadastro/edição autenticada e confiável no backend. Não confie em um perfil enviado livremente pelo navegador para conceder permissões. A função `resolveProfile` centraliza o cálculo do perfil a partir das opções.

## Integração com frontend existente

O frontend atual está em `../frontend/`. Como os formulários de adoção e voluntariado ainda não aparecem entre os HTMLs versionados que foram localizados, os exemplos `public/js/api.js` e `public/exemplos/form-adocao.html` mostram como conectar um formulário futuro sem reescrever as telas atuais.

Exemplo:
```js
const token = localStorage.getItem('ipawz_token');
const resposta = await fetch('http://localhost:3000/api/adocoes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    idPet: Number(document.querySelector('[name="idPet"]').value),
    mensagem: document.querySelector('[name="mensagem"]').value
  })
});
const dados = await resposta.json();
if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível enviar.');
```

## Segurança / produção

- Use HTTPS em produção.
- Não coloque `.env` no Git.
- Tokens JWT não substituem logout/expiração; no logout, remova o token do armazenamento do navegador.
- Para aplicações de produção, prefira cookie `HttpOnly`, `Secure`, `SameSite` em vez de `localStorage`, com proteção CSRF conforme a arquitetura.
- Implemente confirmação de e-mail, recuperação de senha e política de privacidade separadamente.
- Revise limites e campos de formulário conforme o formulário oficial de adoção.
