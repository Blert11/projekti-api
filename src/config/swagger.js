const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Library API',
    version: '1.0.0',
    description:
      'Sistem Bibliotekash REST API — projekt per kursin SPDD (Ueb Sherbime & Ueb API).',
    contact: { name: 'GrupiX', email: 'group@example.com' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'MFA', description: 'Multi-factor authentication (TOTP)' },
    { name: 'Books', description: 'Book catalog management' },
    { name: 'Authors', description: 'Author management' },
    { name: 'Categories', description: 'Category management' },
    { name: 'Members', description: 'Library members' },
    { name: 'Loans', description: 'Borrowing and returning books' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          isbn: { type: 'string' },
          description: { type: 'string' },
          publishedYear: { type: 'integer' },
          totalCopies: { type: 'integer' },
          availableCopies: { type: 'integer' },
          authorId: { type: 'integer' },
          categoryId: { type: 'integer' },
        },
      },
      BookCreate: {
        type: 'object',
        required: ['title', 'isbn', 'authorId'],
        properties: {
          title: { type: 'string' },
          isbn: { type: 'string' },
          description: { type: 'string' },
          publishedYear: { type: 'integer' },
          totalCopies: { type: 'integer', default: 1 },
          authorId: { type: 'integer' },
          categoryId: { type: 'integer' },
        },
      },
      Loan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          bookId: { type: 'integer' },
          memberId: { type: 'integer' },
          loanDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          returnDate: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'RETURNED', 'OVERDUE'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@library.com' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

const options = {
  definition,
  apis: [path.join(__dirname, '..', 'routes', '**', '*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
