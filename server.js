// src/server.js
const app = require('./app');
const config = require('./src/config/config');

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});