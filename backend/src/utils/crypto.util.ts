import crypto from 'crypto';

/**
 * Génère un token opaque à haute entropie (256 bits), encodé en hexadécimal.
 * Utilisé pour les refresh tokens et les tokens de réinitialisation de mot de passe.
 */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Hash déterministe (SHA-256) d'un token opaque avant stockage en base.
 * Un token opaque a déjà une entropie suffisante : SHA-256 (rapide, déterministe)
 * permet une recherche exacte en base tout en évitant de stocker le secret en clair.
 * (bcrypt, volontairement lent et non déterministe, est réservé aux mots de passe utilisateur.)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
