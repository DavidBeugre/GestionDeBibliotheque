import request from 'supertest';
import { RoleName } from '@prisma/client';
import { createApp } from '../app';
import { TokenService } from '../services/token.service';

const app = createApp();

describe('GET /health', () => {
  it('devrait renvoyer un statut 200 avec success: true', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/v1/auth/login - validation', () => {
  it('devrait renvoyer 400 si l’email est invalide (sans toucher la base de données)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'pas-un-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('devrait renvoyer 400 si le mot de passe est manquant', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@library.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me - sans authentification', () => {
  it('devrait renvoyer 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Route inconnue', () => {
  it('devrait renvoyer 404', async () => {
    const res = await request(app).get('/api/v1/route-inexistante');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/members - sans authentification', () => {
  it('devrait renvoyer 401 (données personnelles sensibles, réservé au personnel)', async () => {
    const res = await request(app).get('/api/v1/members');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/books - accès public en lecture', () => {
  it('ne devrait pas renvoyer 401 (le catalogue est consultable sans compte)', async () => {
    const res = await request(app).get('/api/v1/books');
    expect(res.status).not.toBe(401);
  });
});

describe('GET /api/v1/borrows - sans authentification', () => {
  it('devrait renvoyer 401', async () => {
    const res = await request(app).get('/api/v1/borrows');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/reservations - validation', () => {
  it('devrait renvoyer 401 avant même la validation (route protégée)', async () => {
    const res = await request(app).post('/api/v1/reservations').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/notifications - sans authentification', () => {
  it('devrait renvoyer 401', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/settings - accès public', () => {
  it('ne devrait pas renvoyer 401 (paramètres publics de la bibliothèque)', async () => {
    const res = await request(app).get('/api/v1/settings');
    expect(res.status).not.toBe(401);
  });
});

describe('GET /api/v1/audit-logs - RBAC par rôle', () => {
  it('devrait renvoyer 401 sans authentification', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  it('devrait renvoyer 403 pour un rôle LIBRARIAN (réservé à ADMIN)', async () => {
    const token = TokenService.signAccessToken({
      sub: 'u1',
      email: 'librarian@library.com',
      role: RoleName.LIBRARIAN,
      permissions: ['borrow:manage'],
    });
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
