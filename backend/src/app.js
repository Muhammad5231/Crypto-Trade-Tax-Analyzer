const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const routes = require('./routes');

const app = express();
const bodySizeLimitMb = Math.max(env.maxUploadMb || 10, 50);
const bodySizeLimit = `${bodySizeLimitMb}mb`;

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: bodySizeLimit }));
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
