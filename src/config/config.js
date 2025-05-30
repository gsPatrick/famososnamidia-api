// src/config/config.js (no backend)
// Garante que dotenv foi carregado ANTES que este arquivo seja 'required'
// Adicionar a chamada dotenv.config() aqui TAMBÉM, embora app.js já faça,
// garante que este módulo tenha acesso às variáveis caso seja required
// antes de app.js em algum cenário futuro. No seu caso, app.js carrega dotenv primeiro.
require('dotenv').config(); 

// Acessa process.env, que deve ter sido populado por dotenv.config()
module.exports = {
  development: { // Configurações específicas para o ambiente de desenvolvimento
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbHost: process.env.DB_HOST,
    dbPort: parseInt(process.env.DB_PORT, 10) || 5432,
    dbDialect: 'postgres', // ou o dialeto que você está usando
    dbSsl: process.env.DB_SSL === 'true',
  },
  production: { // Configurações para produção (ajuste conforme necessário)
    dbName: process.env.DB_NAME_PROD || process.env.DB_NAME,
    dbUser: process.env.DB_USER_PROD || process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD,
    dbHost: process.env.DB_HOST_PROD || process.env.DB_HOST,
    dbPort: parseInt(process.env.DB_PORT_PROD, 10) || 5432,
    dbDialect: 'postgres',
    dbSsl: process.env.DB_SSL_PROD === 'true' || process.env.DB_SSL === 'true',
  },
  // Configurações JWT e outras configurações globais
  // VERIFIQUE SE process.env.JWT_SECRET ESTÁ DEFINIDO NO SEU ARQUIVO .env
  jwtSecret: process.env.JWT_SECRET, 
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h', // Padrão 1 hora se não definido no .env
  port: process.env.PORT || 3001, // Porta da aplicação backend
  corsOrigin: process.env.CORS_ORIGIN || '*', // '*' permite todas as origens em dev, restrinja em produção
  nodeEnv: process.env.NODE_ENV || 'development',
};