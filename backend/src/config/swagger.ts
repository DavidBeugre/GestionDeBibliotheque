import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API - Shelfly',
      version: '1.0.0',
      description:
        "Documentation de l'API REST de Shelfly. " +
        'Construite au fil des étapes (voir README.md à la racine du projet).',
    },
    servers: [{ url: `http://localhost:${env.port}${env.apiPrefix}`, description: 'Serveur local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.routes.ts', './src/routes/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
