import { generateOpaqueToken, hashToken } from '../crypto.util';

describe('crypto.util', () => {
  it('generateOpaqueToken devrait générer un token unique de forte entropie', () => {
    const t1 = generateOpaqueToken();
    const t2 = generateOpaqueToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[a-f0-9]{128}$/); // 64 bytes en hex
  });

  it('hashToken devrait être déterministe (même entrée -> même sortie)', () => {
    const token = 'un-token-quelconque';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('hashToken devrait produire des sorties différentes pour des entrées différentes', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });
});
