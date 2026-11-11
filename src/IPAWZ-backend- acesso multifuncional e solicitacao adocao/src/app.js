const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { frontendOrigin } = require('./config/env');

const app = express();
app.use(helmet());
app.use(cors({
  origin: frontendOrigin.split(',').map(value => value.trim()),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', projeto: 'IPAWZ API' }));
app.use('/api/auth', authRoutes);
app.use('/api/adocoes', adoptionRoutes);
app.use('/api/voluntariado', volunteerRoutes);
app.use('/api/permissoes', permissionRoutes);

app.use(notFound);
app.use(errorHandler);
module.exports = app;
