import { comparePassword, generateTemporaryPassword, hashPassword, isStrongPassword } from '../password.util';

describe('password.util', () => {
  describe('hashPassword / comparePassword', () => {
    it('devrait hasher un mot de passe et permettre sa vérification', async () => {
      const plain = 'MonMotDePasse123!';
      const hashed = await hashPassword(plain);

      expect(hashed).not.toBe(plain);
      expect(await comparePassword(plain, hashed)).toBe(true);
      expect(await comparePassword('MauvaisMotDePasse', hashed)).toBe(false);
    });

    it('devrait générer un hash différent à chaque appel (salage)', async () => {
      const plain = 'MonMotDePasse123!';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isStrongPassword', () => {
    it.each([
      ['Abcdefg1!', true],
      ['motdepasse', false], // pas de majuscule/chiffre/spécial
      ['MOTDEPASSE1!', false], // pas de minuscule
      ['Motdepasse!', false], // pas de chiffre
      ['Motdepasse1', false], // pas de caractère spécial
      ['Ab1!', false], // trop court
    ])('isStrongPassword(%s) devrait renvoyer %s', (password, expected) => {
      expect(isStrongPassword(password)).toBe(expected);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('devrait générer un mot de passe fort valide', () => {
      const password = generateTemporaryPassword();
      expect(isStrongPassword(password)).toBe(true);
    });

    it('devrait générer des mots de passe différents à chaque appel', () => {
      const a = generateTemporaryPassword();
      const b = generateTemporaryPassword();
      expect(a).not.toBe(b);
    });
  });
});
