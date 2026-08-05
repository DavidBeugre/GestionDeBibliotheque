export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, isOperational = true, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, true, details);
  }
  static unauthorized(message = 'Non authentifié') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Accès refusé') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Ressource introuvable') {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
  static locked(message = 'Compte temporairement verrouillé suite à plusieurs échecs de connexion') {
    return new ApiError(423, message);
  }
  static tooManyRequests(message = 'Trop de requêtes, réessayez plus tard') {
    return new ApiError(429, message);
  }
  static internal(message = 'Erreur interne du serveur') {
    return new ApiError(500, message, false);
  }
}
