# Matriz de permissões

| Perfil | Doar | Adotar | Voluntariar |
|---|---:|---:|---:|
| doador | Sim | Não | Não |
| adotante | Sim | Sim | Não |
| voluntariado | Sim | Não | Sim |
| multifuncional | Sim | Sim | Sim |

A API sempre calcula as permissões a partir do perfil armazenado no banco. O frontend não pode enviar `perfil`, `userId` ou `id_usuario` para obter acesso. O ID do usuário vem exclusivamente do token JWT validado.

`resolveProfile({ adotar: true, voluntariar: true })` retorna `multifuncional`. Doar não é uma escolha excludente: é permissão-base de qualquer perfil autenticado.

Para cadastro/edição de perfil, a escolha precisa ser validada no backend. Não foi adicionada rota pública para trocar o próprio perfil, pois isso permitiria que qualquer pessoa se promovesse a multifuncional. Integre `resolveProfile` à etapa confiável de cadastro ou a uma rota autenticada de atualização com validação de negócio.


## Cadastro inicial

A rota `POST /api/auth/cadastro` recebe `nome`, `email`, `senha` e `opcoesPerfil`.
Exemplo de `opcoesPerfil`: `{ "adotar": true, "voluntariar": true }`.
A senha é armazenada com bcrypt e o perfil é calculado pelo servidor. A API não aceita `perfil` diretamente do navegador.
