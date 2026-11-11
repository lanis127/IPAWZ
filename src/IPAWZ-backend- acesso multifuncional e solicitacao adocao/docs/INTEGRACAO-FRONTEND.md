# Integração do frontend

## 1. Login
Carregue `public/js/api.js` na tela de login e, no submit:
```js
try {
  const usuario = await ipawzLogin(emailInput.value, senhaInput.value);
  window.location.href = 'index.html';
} catch (erro) {
  mensagem.textContent = erro.message;
}
```

## 2. Adoção
A página de formulário precisa enviar `idPet` e `mensagem` para `ipawzSolicitarAdocao`. O usuário deve estar autenticado e possuir `adotante` ou `multifuncional`.

## 3. Perfil e permissões na interface
```js
const { perfil, permissoes } = await ipawzCarregarPermissoes();
document.querySelectorAll('[data-permissao]').forEach((elemento) => {
  elemento.hidden = !permissoes.includes(elemento.dataset.permissao);
});
```
Use `data-permissao="adotar"`, `data-permissao="voluntariar"` ou `data-permissao="doar"`. Isso é apenas controle visual; a autorização real sempre é feita no backend.

## 4. Token
Este exemplo armazena o token em `localStorage` por simplicidade de integração. Para produção, avalie cookie `HttpOnly; Secure; SameSite` e proteção CSRF.
