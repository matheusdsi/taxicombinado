const WEAK_SECRET_VALUES = new Set([
  'changeme',
  'troque_por_uma_chave_jwt_longa_e_aleatoria',
  'troque_por_uma_senha_forte_aqui',
]);

export function requiredSecret(name: string, minLength = 32): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured.`);
  }

  if (value.length < minLength || WEAK_SECRET_VALUES.has(value)) {
    throw new Error(`${name} must be a strong secret with at least ${minLength} characters.`);
  }

  return value;
}
