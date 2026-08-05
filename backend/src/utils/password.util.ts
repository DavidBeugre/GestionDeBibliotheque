import bcrypt from 'bcrypt';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.security.bcryptSaltRounds);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Vérifie la complexité minimale d'un mot de passe :
 * - 8 caractères minimum
 * - au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
 */
export function isStrongPassword(password: string): boolean {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return strongRegex.test(password);
}

/**
 * Génère un mot de passe temporaire fort (utilisé quand un bibliothécaire crée un compte
 * adhérent sans que celui-ci ait choisi son propre mot de passe). Le mot de passe est
 * communiqué une seule fois par email ; l'adhérent est invité à le changer à la connexion.
 */
export function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%?';

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const base = [pick(upper), pick(lower), pick(digits), pick(special)];
  const all = upper + lower + digits + special;
  for (let i = 0; i < 8; i += 1) base.push(pick(all));

  return base.sort(() => Math.random() - 0.5).join('');
}
