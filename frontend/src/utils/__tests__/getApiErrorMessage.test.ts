import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { getApiErrorMessage } from '../getApiErrorMessage';

describe('getApiErrorMessage', () => {
  it('devrait extraire le message renvoyé par l’API', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      data: { success: false, message: 'Email ou mot de passe incorrect' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
    };
    expect(getApiErrorMessage(error)).toBe('Email ou mot de passe incorrect');
  });

  it('devrait retomber sur le message Axios si l’API n’a pas fourni de message', () => {
    const error = new AxiosError('Network Error');
    expect(getApiErrorMessage(error)).toBe('Network Error');
  });

  it('devrait gérer une Error générique', () => {
    expect(getApiErrorMessage(new Error('Erreur inattendue'))).toBe('Erreur inattendue');
  });

  it('devrait utiliser le message de repli pour une valeur inconnue', () => {
    expect(getApiErrorMessage('juste une chaîne', 'Message par défaut')).toBe('Message par défaut');
  });

  it('devrait utiliser le message de repli par défaut si aucun n’est fourni', () => {
    expect(getApiErrorMessage(null)).toBe('Une erreur est survenue');
  });
});
