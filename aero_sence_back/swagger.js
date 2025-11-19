const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aero Sense - API de Qualidade do Ar',
      version: '1.0.0',
      description: 'API para monitoramento em tempo real da qualidade do ar com sensores MQ-135 e CCS811'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'http://172.203.135.173',
        description: 'Servidor de Produção (exemplo)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Scan route/controller files (JS/TS) to generate documentation
  apis: [
    './routes/*.js',
    './src/routes/**/*.js',
    './src/routes/**/*.ts',
    './src/controllers/**/*.js',
    './src/controllers/**/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
