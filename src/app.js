const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const morganStream = { write: (message) => logger.http?.(message.trim()) ?? logger.info(message.trim()) };
app.use(morgan(config.env === 'production' ? 'combined' : 'dev', { stream: morganStream }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 429, message: 'Too many requests, please try again later.' } },
});
app.use('/api', limiter);

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Library API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/v1', v1Routes);

app.get('/', (req, res) => {
  res.json({
    name: 'Library API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/api/v1/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
