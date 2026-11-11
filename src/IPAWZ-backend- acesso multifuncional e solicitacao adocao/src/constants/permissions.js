const PERMISSIONS = Object.freeze({
  DOAR: 'doar',
  ADOTAR: 'adotar',
  VOLUNTARIAR: 'voluntariar'
});

const PROFILE_PERMISSIONS = Object.freeze({
  doador: [PERMISSIONS.DOAR],
  adotante: [PERMISSIONS.DOAR, PERMISSIONS.ADOTAR].filter(Boolean),
  voluntariado: [PERMISSIONS.DOAR, PERMISSIONS.VOLUNTARIAR],
  multifuncional: [PERMISSIONS.DOAR, PERMISSIONS.ADOTAR, PERMISSIONS.VOLUNTARIAR].filter(Boolean)
});

// Recebe as escolhas de funcionalidades. Doar é sempre habilitado.
// Se as duas funcionalidades opcionais estiverem marcadas, é multifuncional.
function resolveProfile(options = {}) {
  const wantsAdopt = options.adotar === true || options.adotante === true;
  const wantsVolunteer = options.voluntariar === true || options.voluntariado === true;
  if (wantsAdopt && wantsVolunteer) return 'multifuncional';
  if (wantsAdopt) return 'adotante';
  if (wantsVolunteer) return 'voluntariado';
  return 'doador';
}

function permissionsForProfile(profile) {
  const permissions = PROFILE_PERMISSIONS[profile];
  if (!permissions) return [PERMISSIONS.DOAR];
  return [...new Set(permissions)];
}

module.exports = { PERMISSIONS, PROFILE_PERMISSIONS, resolveProfile, permissionsForProfile };
