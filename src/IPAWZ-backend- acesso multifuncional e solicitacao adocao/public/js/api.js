// Inclua este arquivo nas páginas que precisarem conversar com a API.
// Ex.: <script src="../js/api.js"></script>
const IPAWZ_API_URL = 'http://localhost:3000/api';

function ipawzToken() {
  return localStorage.getItem('ipawz_token');
}

async function ipawzRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = ipawzToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${IPAWZ_API_URL}${path}`, {
    ...options, headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensagem || 'Não foi possível concluir a operação.');
  return data;
}

async function ipawzLogin(email, senha) {
  const data = await ipawzRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
  localStorage.setItem('ipawz_token', data.token);
  localStorage.setItem('ipawz_usuario', JSON.stringify(data.usuario));
  return data.usuario;
}

function ipawzLogout() {
  localStorage.removeItem('ipawz_token');
  localStorage.removeItem('ipawz_usuario');
}

async function ipawzSolicitarAdocao(idPet, mensagem = '') {
  return ipawzRequest('/adocoes', {
    method: 'POST',
    body: JSON.stringify({ idPet: Number(idPet), mensagem })
  });
}

async function ipawzCandidatarVoluntariado(mensagem, disponibilidade = '') {
  return ipawzRequest('/voluntariado/candidaturas', {
    method: 'POST',
    body: JSON.stringify({ mensagem, disponibilidade })
  });
}

async function ipawzCarregarPermissoes() {
  return ipawzRequest('/permissoes');
}
