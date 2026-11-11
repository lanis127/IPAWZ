require('dotenv').config();
const env = require('./config/env');
const app = require('./app');
const db = require('./config/database');

async function start() {
  await db.query('SELECT 1');
  const server = app.listen(env.port, () => {
    console.log(`IPAWZ API rodando em http://localhost:${env.port}`);
  });
  const shutdown = async () => {
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
start().catch(error => {
  console.error('Não foi possível iniciar a API:', error.message);
  process.exit(1);
});
